const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Sistema de armazenamento persistente para configurações
const configFile = path.join(__dirname, '..', 'server_configs.json');

function loadConfigs() {
    try {
        if (fs.existsSync(configFile)) {
            const data = fs.readFileSync(configFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
    return {};
}

function saveConfigs(configs) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

function getServerConfig(guildId) {
    const configs = loadConfigs();
    return configs[guildId] || null;
}

function setServerConfig(guildId, config) {
    const configs = loadConfigs();
    configs[guildId] = config;
    saveConfigs(configs);
}

module.exports = {
    name: 'verify',
    aliases: ['verificar'],
    description: 'Configurar sistema de verificação do servidor',
    
    slashData: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Configurar sistema de verificação do servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('config')
                .setDescription('Configurar cargos e canal de notificações')
                .addRoleOption(opt => opt.setName('random').setDescription('Cargo random').setRequired(true))
                .addRoleOption(opt => opt.setName('verificado').setDescription('Cargo verificado').setRequired(true))
                .addChannelOption(opt => opt.setName('notificacoes').setDescription('Canal de notificações').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('show')
                .setDescription('Mostrar configurações atuais do servidor')
        )
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Criar embed de verificação no canal atual')
        ),

    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        // Verifica se o usuário é admin
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const noPermEmbed = createYakuzaEmbed(
                'Sem Permissão',
                'Apenas administradores podem usar este comando.',
                colors.error
            );
            return message.reply({ embeds: [noPermEmbed] });
        }

        // Verifica se o servidor está configurado
        const serverConfig = getServerConfig(message.guild.id);
        if (!serverConfig) {
            const notConfiguredEmbed = createYakuzaEmbed(
                'Servidor Não Configurado',
                'Este servidor ainda não foi configurado!\n\n' +
                'Use `/verify config` para configurar os cargos e canal de notificações primeiro.',
                colors.error
            );
            return message.reply({ embeds: [notConfiguredEmbed] });
        }

        await this.createVerificationEmbed(message.channel, colors, createYakuzaEmbed);
        
        const successEmbed = createYakuzaEmbed(
            'Sistema de Verificação',
            'Sistema de verificação configurado com sucesso!',
            colors.success
        );
        await message.reply({ embeds: [successEmbed] });
    },
    
    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const noPermEmbed = createYakuzaEmbed(
                'Sem Permissão',
                'Apenas administradores podem usar este comando.',
                colors.error
            );
            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'config') {
            const randomRole = interaction.options.getRole('random');
            const verifiedRole = interaction.options.getRole('verificado');
            const notifyChannel = interaction.options.getChannel('notificacoes');

            setServerConfig(interaction.guild.id, {
                randomRole: randomRole.id,
                verifiedRole: verifiedRole.id,
                notifyChannel: notifyChannel.id,
                configuredAt: new Date().toISOString(),
                configuredBy: interaction.user.id
            });

            const configEmbed = createYakuzaEmbed(
                'Configuração Salva',
                `**Configurações do servidor atualizadas:**\n\n` +
                `🎭 **Cargo random:** <@&${randomRole.id}>\n` +
                `**Cargo verificado:** <@&${verifiedRole.id}>\n` +
                `📢 **Canal de notificações:** <#${notifyChannel.id}>\n\n` +
                `*Agora você pode usar* \`/verify setup\` *para criar a embed de verificação!*`,
                colors.success
            );
            return interaction.reply({ embeds: [configEmbed], ephemeral: true });
        }

        if (subcommand === 'show') {
            const serverConfig = getServerConfig(interaction.guild.id);
            if (!serverConfig) {
                const notConfiguredEmbed = createYakuzaEmbed(
                    'Servidor Não Configurado',
                    'Este servidor ainda não foi configurado!\n\n' +
                    'Use `/verify config` para configurar os cargos e canal de notificações.',
                    colors.error
                );
                return interaction.reply({ embeds: [notConfiguredEmbed], ephemeral: true });
            }

            const configDate = new Date(serverConfig.configuredAt).toLocaleString('pt-BR');
            const configEmbed = createYakuzaEmbed(
                'Configurações Atuais ⚙️',
                `**Configurações do servidor:**\n\n` +
                `🎭 **Cargo random:** <@&${serverConfig.randomRole}>\n` +
                `**Cargo verificado:** <@&${serverConfig.verifiedRole}>\n` +
                `📢 **Canal de notificações:** <#${serverConfig.notifyChannel}>\n\n` +
                `*Configurado em:* ${configDate}\n` +
                `*Configurado por:* <@${serverConfig.configuredBy}>`,
                colors.primary
            );
            return interaction.reply({ embeds: [configEmbed], ephemeral: true });
        }

        if (subcommand === 'setup') {
            const serverConfig = getServerConfig(interaction.guild.id);
            if (!serverConfig) {
                const notConfiguredEmbed = createYakuzaEmbed(
                    'Servidor Não Configurado',
                    'Este servidor ainda não foi configurado!\n\n' +
                    'Use `/verify config` para configurar os cargos e canal de notificações primeiro.',
                    colors.error
                );
                return interaction.reply({ embeds: [notConfiguredEmbed], ephemeral: true });
            }

            await this.createVerificationEmbed(interaction.channel, colors, createYakuzaEmbed);
            const successEmbed = createYakuzaEmbed(
                'Sistema de Verificação Criado',
                'Embed de verificação criada com sucesso no canal atual!',
                colors.success
            );
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
    },

    async createVerificationEmbed(channel, colors, createYakuzaEmbed) {
        const verifyEmbed = createYakuzaEmbed(
            '> Verificação',
            '**Bem-vindo(a) ao nosso servidor!**\n\n' +
            '**Para ter acesso completo ao servidor, você precisa se verificar.**\n\n' +
            'Clique no botão **"Iniciar Verificação"** abaixo\n' +
            'O bot irá te chamar no privado para uma conversa rápida\n' +
            'Após a aprovação da staff, você terá acesso total\n\n' +
            '**Importante:**\n' +
            '• Seja respeitoso com todos os membros\n' +
            '• Não faça spam ou flood\n' +
            '• Siga as regras do servidor e do Discord\n\n' +
            '**Clique no botão para começar sua verificação!**',
            colors.primary
        );

        const verifyButton = new ButtonBuilder()
            .setCustomId('verification')
            .setLabel('Iniciar Verificação')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(verifyButton);

        await channel.send({ 
            embeds: [verifyEmbed], 
            components: [row] 
        });
    }
};