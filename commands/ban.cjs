const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    aliases: ['vaza'],
    description: 'Banir um usuário do servidor',
    
    slashData: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banir um usuário do servidor')
        .addUserOption(option =>
            option.setName('usuário')
                .setDescription('Usuário a ser banido')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do banimento')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const errorEmbed = createYakuzaEmbed(
                'Sem Permissão',
                'Você não tem permissão para banir membros.',
                colors.error
            );
            return await message.reply({ embeds: [errorEmbed] });
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            const errorEmbed = createYakuzaEmbed(
                
                '`Por favor, mencione um usuário válido ou forneça um ID.`',
                colors.error
            );
            return await message.reply({ embeds: [errorEmbed] });
        }

        const member = message.guild.members.cache.get(user.id);
        const reason = args.slice(1).join(' ') || 'Motivo não especificado';

        await banUser(message.guild, user, member, reason, message.author, message, null, colors, createYakuzaEmbed);
    },
    
    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        const user = interaction.options.getUser('usuário');
        const reason = interaction.options.getString('motivo') || 'Motivo não especificado';
        const member = interaction.guild.members.cache.get(user.id);

        await banUser(interaction.guild, user, member, reason, interaction.user, null, interaction, colors, createYakuzaEmbed);
    }
};

async function banUser(guild, user, member, reason, executor, message, interaction, colors, createYakuzaEmbed) {
    try {
        // Verificações de hierarquia
        if (member) {
            const executorMember = message ? message.member : interaction.member;
            
            if (member.roles.highest.position >= executorMember.roles.highest.position) {
                const errorEmbed = createYakuzaEmbed(
                    'Hierarquia Insuficiente',
                    'Você não pode banir este usuário devido à hierarquia de cargos.',
                    colors.error
                );
                
                if (message) {
                    return await message.reply({ embeds: [errorEmbed] });
                } else {
                    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
            
            if (!member.bannable) {
                const errorEmbed = createYakuzaEmbed(
                    'Não Banível',
                    'Não posso banir este usuário. Verifique minhas permissões e a hierarquia.',
                    colors.error
                );
                
                if (message) {
                    return await message.reply({ embeds: [errorEmbed] });
                } else {
                    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }

        // Tentar enviar DM antes do ban
        try {
            const dmEmbed = createYakuzaEmbed(
                '🔨 Você foi banido!',
                `**Servidor:** ${guild.name}\n**Motivo:** ${reason}\n**Moderador:** ${executor.tag}`,
                colors.error
            );
            await user.send({ embeds: [dmEmbed] });
        } catch (error) {
            // Ignorar se não conseguir enviar DM
        }

        // Executar o banimento
        await guild.members.ban(user, { reason: `${reason} - Banido por: ${executor.tag}` });

        // Embed de confirmação
        const successEmbed = createYakuzaEmbed(
            '🔨 Usuário Banido',
            `**Usuário:** ${user.tag} (${user.id})\n🩸 **Motivo:** ${reason}\n⚡ **Moderador:** ${executor.tag}`,
            colors.accent
        );

        if (message) {
            await message.reply({ embeds: [successEmbed] });
        } else {
            await interaction.reply({ embeds: [successEmbed] });
        }

    } catch (error) {
        console.error('Erro ao banir usuário:', error);
        
        const errorEmbed = createYakuzaEmbed(
            'Erro no Banimento',
            'Ocorreu um erro ao tentar banir o usuário.',
            colors.error
        );
        
        if (message) {
            await message.reply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}