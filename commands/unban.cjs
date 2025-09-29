const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Desbanir um usuário do servidor',
    
    slashData: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbanir um usuário do servidor')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID do usuário a ser desbanido')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do desbanimento')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const errorEmbed = createYakuzaEmbed(
                'Sem Permissão',
                'Você não tem permissão para desbanir membros.',
                colors.error
            );
            return await message.reply({ embeds: [errorEmbed] });
        }

        const userId = args[0];
        if (!userId) {
            const errorEmbed = createYakuzaEmbed(
                'ID Necessário',
                'Por favor, forneça o ID do usuário a ser desbanido.',
                colors.error
            );
            return await message.reply({ embeds: [errorEmbed] });
        }

        const reason = args.slice(1).join(' ') || 'Motivo não especificado';
        await unbanUser(message.guild, userId, reason, message.author, message, null, client, colors, createYakuzaEmbed);
    },
    
    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        const userId = interaction.options.getString('id');
        const reason = interaction.options.getString('motivo') || 'Motivo não especificado';

        await unbanUser(interaction.guild, userId, reason, interaction.user, null, interaction, client, colors, createYakuzaEmbed);
    }
};

async function unbanUser(guild, userId, reason, executor, message, interaction, client, colors, createYakuzaEmbed) {
    try {
        // Verificar se o usuário existe
        let user;
        try {
            user = await client.users.fetch(userId);
        } catch (error) {
            const errorEmbed = createYakuzaEmbed(
                'Usuário Inválido',
                'ID de usuário inválido ou usuário não encontrado.',
                colors.error
            );
            
            if (message) {
                return await message.reply({ embeds: [errorEmbed] });
            } else {
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Verificar se o usuário está banido
        const bans = await guild.bans.fetch();
        const bannedUser = bans.get(userId);
        
        if (!bannedUser) {
            const errorEmbed = createYakuzaEmbed(
                'Usuário Não Banido',
                'Este usuário não está banido do servidor.',
                colors.error
            );
            
            if (message) {
                return await message.reply({ embeds: [errorEmbed] });
            } else {
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Executar o desbanimento
        await guild.members.unban(userId, `${reason} - Desbanido por: ${executor.tag}`);

        // Tentar enviar DM
        try {
            const dmEmbed = createYakuzaEmbed(
                'Você foi desbanido!',
                `**Servidor:** ${guild.name}\n**Motivo:** ${reason}\n**Moderador:** ${executor.tag}`,
                colors.success
            );
            await user.send({ embeds: [dmEmbed] });
        } catch (error) {
            // Ignorar se não conseguir enviar DM
        }

        // Embed de confirmação
        const successEmbed = createYakuzaEmbed(
            'Usuário Desbanido',
            `**Usuário:** ${user.tag} (${user.id})\n🩸 **Motivo:** ${reason}\n⚡ **Moderador:** ${executor.tag}`,
            colors.success
        );

        if (message) {
            await message.reply({ embeds: [successEmbed] });
        } else {
            await interaction.reply({ embeds: [successEmbed] });
        }

    } catch (error) {
        console.error('Erro ao desbanir usuário:', error);
        
        const errorEmbed = createYakuzaEmbed(
            'Erro no Desbanimento',
            'Ocorreu um erro ao tentar desbanir o usuário.',
            colors.error
        );
        
        if (message) {
            await message.reply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}