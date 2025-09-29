const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Mostrar avatar de um usuário',
    
    slashData: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Mostrar avatar de um usuário')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('Usuário para mostrar o avatar')
                .setRequired(false)
        ),
    
    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        const user = message.mentions.users.first() || 
                    (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || 
                    message.author;
        
        await showAvatar(user, message, null, colors, createYakuzaEmbed);
    },
    
    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        const user = interaction.options.getUser('usuário') || interaction.user;
        await showAvatar(user, null, interaction, colors, createYakuzaEmbed);
    }
};

async function showAvatar(user, message, interaction, colors, createYakuzaEmbed) {
    try {
        const avatarEmbed = createYakuzaEmbed(
            `> Avatar de ** ${user.username} **`,
            `**> ID:** ${user.id}\n **> Tag:** ${user.tag}`,
            colors.accent
        );
        
        // Avatar principal
        const avatarURL = user.displayAvatarURL({ 
            dynamic: true, 
            size: 1024 
        });
        
        avatarEmbed.setImage(avatarURL);
        avatarEmbed.setThumbnail(avatarURL);
        
        // Links para diferentes formatos
        const avatarLinks = [
            `[PNG](${user.displayAvatarURL({ extension: 'png', size: 1024 })})`,
            `[JPG](${user.displayAvatarURL({ extension: 'jpg', size: 1024 })})`,
            `[WEBP](${user.displayAvatarURL({ extension: 'webp', size: 1024 })})`
        ];
        
        // Se o avatar for GIF, adicionar link GIF
        if (user.avatar && user.avatar.startsWith('a_')) {
            avatarLinks.push(`[GIF](${user.displayAvatarURL({ extension: 'gif', size: 1024 })})`);
        }
        
        avatarEmbed.addFields({
            name: 'Downloads',
            value: avatarLinks.join(' • '),
            inline: false
        });
        
        // Avatar do servidor (se diferente)
        if (message) {
            const member = message.guild.members.cache.get(user.id);
            if (member && member.avatar && member.avatar !== user.avatar) {
                const guildAvatarURL = member.displayAvatarURL({ 
                    dynamic: true, 
                    size: 1024 
                });
                
                avatarEmbed.addFields({
                    name: 'Avatar do Servidor',
                    value: `[Clique aqui](${guildAvatarURL})`,
                    inline: true
                });
            }
        } else if (interaction) {
            const member = interaction.guild.members.cache.get(user.id);
            if (member && member.avatar && member.avatar !== user.avatar) {
                const guildAvatarURL = member.displayAvatarURL({ 
                    dynamic: true, 
                    size: 1024 
                });
                
                avatarEmbed.addFields({
                    name: 'Avatar do Servidor',
                    value: `[Clique aqui](${guildAvatarURL})`,
                    inline: true
                });
            }
        }
        
        if (message) {
            await message.reply({ embeds: [avatarEmbed] });
        } else {
            await interaction.reply({ embeds: [avatarEmbed] });
        }
        
    } catch (error) {
        console.error('Erro ao mostrar avatar:', error);
        
        const errorEmbed = createYakuzaEmbed(
            'Erro',
            'Não foi possível obter o avatar deste usuário.',
            colors.error
        );
        
        if (message) {
            await message.reply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}