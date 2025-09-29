const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    aliases: ['ui', 'info', 'whois'],
    description: 'Mostrar informações detalhadas de um usuário',
    
    slashData: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Mostrar informações detalhadas de um usuário')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('Usuário para mostrar informações')
                .setRequired(false)
        ),
    
    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        const user = message.mentions.users.first() || 
                    (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || 
                    message.author;
        
        const member = message.guild.members.cache.get(user.id);
        await showUserInfo(user, member, message, null, colors, createYakuzaEmbed);
    },
    
    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        const user = interaction.options.getUser('usuário') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        await showUserInfo(user, member, null, interaction, colors, createYakuzaEmbed);
    }
};

async function showUserInfo(user, member, message, interaction, colors, createYakuzaEmbed) {
    try {
        const userEmbed = createYakuzaEmbed(
            `<:seta2:1421174896960213174>  Informações de ${user.username}`,
            null,
            colors.accent
        );
        
        userEmbed.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }));
        
        // Informações básicas
        userEmbed.addFields({
            name: '> Informações Básicas',
            value: [
                `<:seta1:1421174893915013260>  **Nome:** ${user.username}`,
                `<:seta1:1421174893915013260>  **Tag:** ${user.tag}`,
                `<:seta1:1421174893915013260>  **ID:** ${user.id}`,
                `**<:bot:1421174891037855876>** ${user.bot ? 'sim ' : 'não'}`,
                `**<:seta1:1421174893915013260> Criado em:** <t:${Math.floor(user.createdTimestamp / 1000)}:D>`
            ].join('\n'),
            inline: false
        });
        
        // Informações do servidor (se o usuário estiver no servidor)
        if (member) {
            const roles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .first(10)
                .map(role => `<@&${role.id}>`)
                .join(', ') || 'Nenhum cargo';
                
            userEmbed.addFields({
                name: '> Informações do Servidor',
                value: [
                    `**<:seta1:1421174893915013260>  Apelido:** ${member.nickname || 'Nenhum'}`,
                    `**<:seta1:1421174893915013260> Entrou em:** <t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
                    `**<:seta1:1421174893915013260> Cargo mais alto:** <@&${member.roles.highest.id}>`,
                    `**<:seta1:1421174893915013260> Cargos (${member.roles.cache.size - 1}):** ${roles}`
                ].join('\n'),
                inline: false
            });
            
            // Status e atividades
            const status = {
                online: 'online',
                idle: 'ausente',
                dnd: 'não pertube',
                offline: 'offline'
            };
            
            let statusText = status[member.presence?.status] || 'Offline';
            
            if (member.presence?.activities?.length > 0) {
                const activity = member.presence.activities[0];
                let activityText = '';
                
                switch (activity.type) {
                    case 0: // PLAYING
                        activityText = `jogando **${activity.name}**`;
                        break;
                    case 1: // STREAMING
                        activityText = `transmitindo **${activity.name}**`;
                        break;
                    case 2: // LISTENING
                        activityText = `ouvindo **${activity.name}**`;
                        break;
                    case 3: // WATCHING
                        activityText = `assistindo **${activity.name}**`;
                        break;
                    case 4: // CUSTOM
                        activityText = ` ${activity.state || activity.name || 'Status personalizado'}`;
                        break;
                    case 5: // COMPETING
                        activityText = `competindo em **${activity.name}**`;
                        break;
                    default:
                        activityText = `**${activity.name}**`;
                }
                
                statusText += `\n**Atividade:** ${activityText}`;
            }
            
            userEmbed.addFields({
                name: ' **status**',
                value: statusText,
                inline: true
            });
        }
        
        // Badges/Flags do usuário
        const flags = user.flags?.toArray() || [];
        if (flags.length > 0) {
            const flagEmojis = {
                Staff: '<:staff:1421172471868162130>',
                Partner: '<:partner:1421172470187719680>',
                Hypesquad: '',
                BugHunterLevel1: '<:bughunter1:1421172446178054244>',
                BugHunterLevel2: '<:bughunter2:1421172448400773230>',
                HypeSquadOnlineHouse1: '<:housebravery:1421172453127753729>', // Bravery
                HypeSquadOnlineHouse2: '<:houseBrilliance:1421172461596184754>', // Brilliance
                HypeSquadOnlineHouse3: '<:houseBalance:1421172451362213988>', // Balance
                PremiumEarlySupporter: '💎',
                VerifiedDeveloper: '<:devloper:1421172449914917046>',
                CertifiedModerator: '<:moderador:1421172462829305888>'
            };
            
            const userFlags = flags.map(flag => `${flagEmojis[flag] || '🏷️'} ${flag}`).join('\n');
            
            userEmbed.addFields({
                name: '**> badges**',
                value: userFlags,
                inline: true
            });
        }
        
        // Botões interativos
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`avatar_${user.id}`)
                    .setLabel('Avatar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:seta1:1421174893915013260>'),
                new ButtonBuilder()
                    .setCustomId(`banner_${user.id}`)
                    .setLabel('Banner')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:seta1:1421174893915013260>'),
                new ButtonBuilder()
                    .setCustomId(`permissions_${user.id}`)
                    .setLabel('Permissões')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:seta1:1421174893915013260>')
            );
        
        if (message) {
            await message.reply({ embeds: [userEmbed], components: [buttons] });
        } else {
            await interaction.reply({ embeds: [userEmbed], components: [buttons] });
        }
        
    } catch (error) {
        console.error('Erro ao mostrar informações do usuário:', error);
        
        const errorEmbed = createYakuzaEmbed(
            'Erro',
            '> `Não foi possível obter as informações deste usuário.`',
            colors.error
        );
        
        if (message) {
            await message.reply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}