const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'clear',
    aliases: ['limpar', 'purge'],
    description: 'Limpar mensagens do canal',
    
    slashData: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpar mensagens do canal')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Número de mensagens para limpar (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = createYakuzaEmbed(
                'Sem Permissão',
                'Você não tem permissão para gerenciar mensagens.',
                colors.error
            );
            return await message.reply({ embeds: [errorEmbed] });
        }

        const amount = parseInt(args[0]);
        await clearMessages(message.channel, amount, message.author, message, null, colors, createYakuzaEmbed);
    },
    
    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        const amount = interaction.options.getInteger('quantidade');
        await clearMessages(interaction.channel, amount, interaction.user, null, interaction, colors, createYakuzaEmbed);
    }
};

async function clearMessages(channel, amount, executor, message, interaction, colors, createYakuzaEmbed) {
    try {
        if (!amount || amount < 1 || amount > 100) {
            const errorEmbed = createYakuzaEmbed(
                'Quantidade Inválida',
                'Por favor, forneça um número entre 1 e 100.',
                colors.error
            );
            
            if (message) {
                return await message.reply({ embeds: [errorEmbed] });
            } else {
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Se for comando com prefixo, incluir a mensagem do comando na contagem
        const deleteAmount = message ? amount + 1 : amount;

        // Buscar mensagens
        const messages = await channel.messages.fetch({ limit: deleteAmount });
        
        // Filtrar mensagens que não são muito antigas (14 dias)
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        const recentMessages = messages.filter(msg => 
            Date.now() - msg.createdTimestamp < twoWeeks
        );

        if (recentMessages.size === 0) {
            const errorEmbed = createYakuzaEmbed(
                'Nenhuma Mensagem',
                'Não há mensagens recentes para deletar (menos de 14 dias).',
                colors.error
            );
            
            if (message) {
                return await message.reply({ embeds: [errorEmbed] });
            } else {
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Deletar mensagens
        let deletedCount = 0;
        
        if (recentMessages.size > 1) {
            // Bulk delete para múltiplas mensagens
            const deleted = await channel.bulkDelete(recentMessages, true);
            deletedCount = deleted.size;
        } else {
            // Delete individual para uma mensagem
            await recentMessages.first().delete();
            deletedCount = 1;
        }

        // Ajustar contagem se incluiu a mensagem do comando
        if (message && deletedCount > 0) {
            deletedCount -= 1;
        }

        // Embed de confirmação
        const successEmbed = createYakuzaEmbed(
            '🗑️ Mensagens Limpas',
            `**Deletadas:** ${deletedCount} mensagens\n⚡ **Moderador:** ${executor.tag}\n**Canal:** ${channel.name}`,
            colors.accent
        );

        if (message) {
            // Para comandos de prefixo, a mensagem já foi deletada
            const confirmMsg = await channel.send({ embeds: [successEmbed] });
            setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);
        } else {
            await interaction.reply({ embeds: [successEmbed] });
        }

    } catch (error) {
        console.error('Erro ao limpar mensagens:', error);
        
        const errorEmbed = createYakuzaEmbed(
            'Erro na Limpeza',
            'Ocorreu um erro ao tentar limpar as mensagens.',
            colors.error
        );
        
        if (message) {
            await message.reply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}