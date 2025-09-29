const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');
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
    if (!configs[guildId]) {
        configs[guildId] = {
            stats: {
                bans: 0,
                mutes: 0,
                kicks: 0
            },
            statusChecker: {
                enabled: false,
                requiredText: null,
                roleId: null,
                channelId: null,
                embedConfig: {
                    title: null,
                    description: null,
                    image: null,
                    thumbnail: null
                },
                monitoredUsers: {}
            },
            embedConfigs: {
                mute: {
                    title: "Usuário Mutado",
                    description: "O usuário foi mutado do servidor.",
                    color: 0xff0000
                },
                ban: {
                    title: "Usuário Banido", 
                    description: "O usuário foi banido do servidor.",
                    color: 0xff0000
                }
            }
        };
        saveConfigs(configs);
    }
    return configs[guildId];
}

function setServerConfig(guildId, config) {
    const configs = loadConfigs();
    configs[guildId] = config;
    saveConfigs(configs);
}

// Função para verificar se o usuário é staff
function isStaff(member) {
    return member.permissions.has(PermissionFlagsBits.KickMembers) || 
           member.permissions.has(PermissionFlagsBits.BanMembers) ||
           member.permissions.has(PermissionFlagsBits.ManageMessages) ||
           member.permissions.has(PermissionFlagsBits.ModerateMembers);
}

// Função para verificar se é owner ou dev
function isOwnerOrDev(member, ownerId) {
    return member.guild.ownerId === member.id || 
           member.id === ownerId;
}

// Função para obter o cargo mais alto do staff
function getHighestStaffRole(member) {
    const staffRoles = member.roles.cache
        .filter(role => role.permissions.has(PermissionFlagsBits.KickMembers) || 
                       role.permissions.has(PermissionFlagsBits.BanMembers) ||
                       role.permissions.has(PermissionFlagsBits.ManageMessages))
        .sort((a, b) => b.position - a.position);
    
    return staffRoles.first() || null;
}

module.exports = {
    name: 'painel',
    aliases: ['panel'],
    description: 'Abrir painel administrativo do servidor',
    
    slashData: new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Abrir painel administrativo do servidor'),

    async execute(message, args, client, config, colors, createYakuzaEmbed, emojis) {
        const member = message.member;
        
        // Verificar se é staff
        if (!isStaff(member)) {
            const noPermEmbed = createYakuzaEmbed(
                'Acesso Negado',
                'Apenas membros da staff podem acessar o painel administrativo.',
                colors.error
            );
            return message.reply({ embeds: [noPermEmbed] });
        }

        await this.showPanel(message, member, client, config, colors, createYakuzaEmbed, emojis);
    },

    async executeSlash(interaction, client, config, colors, createYakuzaEmbed, emojis) {
        const member = interaction.member;
        
        // Verificar se é staff
        if (!isStaff(member)) {
            const noPermEmbed = createYakuzaEmbed(
                'Acesso Negado',
                'Apenas membros da staff podem acessar o painel administrativo.',
                colors.error
            );
            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        await this.showPanel(interaction, member, client, config, colors, createYakuzaEmbed, emojis);
    },

    async showPanel(context, member, client, config, colors, createYakuzaEmbed, emojis) {
        const serverConfig = getServerConfig(context.guild.id);
        const isOwnerDev = isOwnerOrDev(member, config.ownerId);
        const highestRole = getHighestStaffRole(member);
        
        // Criar embed do painel
        const panelType = isOwnerDev ? 'Owner/Desenvolvedor' : 'Staff';
        const panelEmbed = createYakuzaEmbed(
            `${emojis.config} Painel ${panelType}`,
            `Bem-vindo ao painel administrativo, ${member.displayName}!`,
            colors.primary
        );

        // Adicionar estatísticas
        panelEmbed.addFields([
            {
                name: `${emojis.info2} Estatísticas do Servidor`,
                value: `**Usuários Banidos:** ${serverConfig.stats.bans}\n**Usuários Mutados:** ${serverConfig.stats.mutes}\n**Usuários Expulsos:** ${serverConfig.stats.kicks}`,
                inline: true
            },
            {
                name: `${emojis.info} Informações do Staff`,
                value: `**Cargo mais alto:** ${highestRole ? highestRole.name : 'Nenhum'}\n**Nível de acesso:** ${panelType}`,
                inline: true
            }
        ]);

        // Criar botões base (para todos os staffs)
        const buttons = [
            new ButtonBuilder()
                .setCustomId('config_mute_embed')
                .setLabel('Configurar Embed Mute')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.muted),
            new ButtonBuilder()
                .setCustomId('config_ban_embed')
                .setLabel('Configurar Embed Ban')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.reason)
        ];

        // Adicionar botão Status Checker apenas para Owner/Dev
        if (isOwnerDev) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId('status_checker_main')
                    .setLabel('Status Checker')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(emojis.user)
            );
        }

        const actionRow = new ActionRowBuilder().addComponents(buttons);

        // Responder com o painel
        const replyOptions = { embeds: [panelEmbed], components: [actionRow] };
        
        if (context.deferred || context.replied) {
            await context.followUp(replyOptions);
        } else if (context.reply) {
            await context.reply(context.isSlashCommand ? { ...replyOptions, ephemeral: true } : replyOptions);
        } else {
            await context.reply(replyOptions);
        }
    },

    // Função para lidar com interações de botões
    async handleButtonInteraction(interaction, client, config, colors, createYakuzaEmbed) {
        const { customId } = interaction;
        const member = interaction.member;
        const serverConfig = getServerConfig(interaction.guild.id);

        switch (customId) {
            case 'config_mute_embed':
                await this.showEmbedConfigModal(interaction, 'mute', 'Configurar Embed de Mute');
                break;
                
            case 'config_ban_embed':
                await this.showEmbedConfigModal(interaction, 'ban', 'Configurar Embed de Ban');
                break;
                
            case 'status_checker_main':
                if (!isOwnerOrDev(member, config.ownerId)) {
                    const noPermEmbed = createYakuzaEmbed(
                        'Acesso Negado',
                        'Apenas o owner e desenvolvedores podem acessar o Status Checker.',
                        colors.error
                    );
                    return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
                }
                await this.showStatusCheckerConfig(interaction, client, config, colors, createYakuzaEmbed);
                break;
                
            case 'status_config_text':
                await this.showStatusConfigModal(interaction, 'text', 'Configurar Texto Obrigatório');
                break;
                
            case 'status_config_role':
                await this.showStatusConfigModal(interaction, 'role', 'Configurar Cargo');
                break;
                
            case 'status_config_channel':
                await this.showStatusConfigModal(interaction, 'channel', 'Configurar Canal');
                break;
                
            case 'status_config_embed':
                await this.showStatusEmbedConfigModal(interaction);
                break;
                
            case 'obter_cargo':
                await this.handleObterCargo(interaction, client, config, colors, createYakuzaEmbed);
                break;
        }
    },

    async showEmbedConfigModal(interaction, type, title) {
        const modal = new ModalBuilder()
            .setCustomId(`embed_config_${type}`)
            .setTitle(title);

        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Título da Embed')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(256);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('embed_description')
            .setLabel('Descrição da Embed')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        const colorInput = new TextInputBuilder()
            .setCustomId('embed_color')
            .setLabel('Cor da Embed (hex, ex: #ff0000)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('#ff0000');

        const actionRows = [
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput)
        ];

        modal.addComponents(actionRows);
        await interaction.showModal(modal);
    },

    async showStatusCheckerConfig(interaction, client, config, colors, createYakuzaEmbed) {
        const serverConfig = getServerConfig(interaction.guild.id);
        const statusConfig = serverConfig.statusChecker;
        
        const statusEmbed = createYakuzaEmbed(
            'Configuração do Status Checker',
            'Configure o sistema de verificação de status personalizado dos membros.',
            colors.accent
        );

        statusEmbed.addFields([
            {
                name: 'Texto Configurado',
                value: statusConfig.requiredText || 'Nenhum texto configurado',
                inline: true
            },
            {
                name: 'Cargo Configurado',
                value: statusConfig.roleId ? `<@&${statusConfig.roleId}>` : 'Nenhum cargo configurado',
                inline: true
            },
            {
                name: 'Canal Configurado',
                value: statusConfig.channelId ? `<#${statusConfig.channelId}>` : 'Nenhum canal configurado',
                inline: true
            },
            {
                name: 'Status',
                value: statusConfig.enabled ? 'Ativo' : 'Inativo',
                inline: true
            }
        ]);

        const buttons = [
            new ButtonBuilder()
                .setCustomId('status_config_text')
                .setLabel('Configurar Texto')
                .setStyle(ButtonStyle.Primary)
                .setEmoji(''),
            new ButtonBuilder()
                .setCustomId('status_config_role')
                .setLabel('Configurar Cargo')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(''),
            new ButtonBuilder()
                .setCustomId('status_config_channel')
                .setLabel('Configurar Canal')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(''),
            new ButtonBuilder()
                .setCustomId('status_config_embed')
                .setLabel('Configurar Embed')
                .setStyle(ButtonStyle.Success)
                .setEmoji('')
        ];

        const actionRow = new ActionRowBuilder().addComponents(buttons);
        
        await interaction.reply({ 
            embeds: [statusEmbed], 
            components: [actionRow], 
            ephemeral: true 
        });
    },

    async showStatusConfigModal(interaction, type, title) {
        if (type === 'text') {
            const modal = new ModalBuilder()
                .setCustomId('status_config_text_modal')
                .setTitle(title);

            const textInput = new TextInputBuilder()
                .setCustomId('required_text')
                .setLabel('Texto obrigatório no status personalizado')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder('Digite o texto que deve aparecer no status');

            const actionRow = new ActionRowBuilder().addComponents(textInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
        } else if (type === 'role') {
            const modal = new ModalBuilder()
                .setCustomId('status_config_role_modal')
                .setTitle(title);

            const roleInput = new TextInputBuilder()
                .setCustomId('role_id')
                .setLabel('ID do cargo (clique direito no cargo → Copiar ID)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder('123456789012345678');

            const actionRow = new ActionRowBuilder().addComponents(roleInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
        } else if (type === 'channel') {
            const modal = new ModalBuilder()
                .setCustomId('status_config_channel_modal')
                .setTitle(title);

            const channelInput = new TextInputBuilder()
                .setCustomId('channel_id')
                .setLabel('ID do canal (clique direito no canal → Copiar ID)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder('123456789012345678');

            const actionRow = new ActionRowBuilder().addComponents(channelInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
        }
    },

    async showStatusEmbedConfigModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('status_embed_config_modal')
            .setTitle('Configurar Embed "Obter Cargo"');

        const titleInput = new TextInputBuilder()
            .setCustomId('status_embed_title')
            .setLabel('Título da embed (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(256);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('status_embed_description')
            .setLabel('Descrição da embed (obrigatório)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        const imageInput = new TextInputBuilder()
            .setCustomId('status_embed_image')
            .setLabel('URL da imagem (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('https://imgur.com/exemplo.png');

        const thumbnailInput = new TextInputBuilder()
            .setCustomId('status_embed_thumbnail')
            .setLabel('URL da thumbnail (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('https://imgur.com/exemplo.png');

        const actionRows = [
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(thumbnailInput)
        ];

        modal.addComponents(actionRows);
        await interaction.showModal(modal);
    },

    async handleObterCargo(interaction, client, config, colors, createYakuzaEmbed) {
        const serverConfig = getServerConfig(interaction.guild.id);
        const statusConfig = serverConfig.statusChecker;
        
        if (!statusConfig.enabled || !statusConfig.requiredText || !statusConfig.roleId) {
            const notConfiguredEmbed = createYakuzaEmbed(
                'Sistema Não Configurado',
                'O Status Checker não está configurado corretamente neste servidor.',
                colors.error
            );
            return interaction.reply({ embeds: [notConfiguredEmbed], ephemeral: true });
        }

        const member = interaction.member;
        const targetRole = interaction.guild.roles.cache.get(statusConfig.roleId);
        
        if (!targetRole) {
            const roleNotFoundEmbed = createYakuzaEmbed(
                'Cargo Não Encontrado',
                'O cargo configurado não foi encontrado no servidor.',
                colors.error
            );
            return interaction.reply({ embeds: [roleNotFoundEmbed], ephemeral: true });
        }

        // Verificar se o bot tem permissão para dar o cargo
        const botMember = interaction.guild.members.cache.get(client.user.id);
        if (!targetRole.editable || targetRole.position >= botMember.roles.highest.position) {
            const noPermEmbed = createYakuzaEmbed(
                'Sem Permissão',
                'O bot não tem permissão para gerenciar este cargo. Verifique se o cargo do bot está acima do cargo configurado.',
                colors.error
            );
            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        // Verificar o status personalizado do usuário
        try {
            const guildMember = await interaction.guild.members.fetch(member.id, { force: true });
            const presence = guildMember.presence;
            
            let hasRequiredText = false;
            
            if (presence && presence.activities) {
                // Verificar atividades customizadas (status personalizado)
                for (const activity of presence.activities) {
                    if (activity.type === 4 && activity.state && activity.state.includes(statusConfig.requiredText)) {
                        hasRequiredText = true;
                        break;
                    }
                }
            }
            
            if (hasRequiredText) {
                // Usuário tem o texto no status - dar o cargo
                if (member.roles.cache.has(statusConfig.roleId)) {
                    const alreadyHasRoleEmbed = createYakuzaEmbed(
                        'Cargo Já Possuído',
                        `Você já possui o cargo ${targetRole.name}!`,
                        colors.success
                    );
                    return interaction.reply({ embeds: [alreadyHasRoleEmbed], ephemeral: true });
                }
                
                await member.roles.add(statusConfig.roleId);
                
                // Incrementar estatísticas
                serverConfig.stats.statusCheckerSuccess = (serverConfig.stats.statusCheckerSuccess || 0) + 1;
                setServerConfig(interaction.guild.id, serverConfig);
                
                const successEmbed = createYakuzaEmbed(
                    'Cargo Obtido com Sucesso',
                    `Você recebeu o cargo ${targetRole.name} por ter o texto obrigatório em seu status personalizado!`,
                    colors.success
                );
                
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                
                // Monitorar este usuário para remoção automática
                this.addUserToMonitoring(member.id, interaction.guild.id, statusConfig.requiredText, statusConfig.roleId);
                
            } else {
                // Usuário não tem o texto no status
                const noTextEmbed = createYakuzaEmbed(
                    'Texto Não Encontrado',
                    `Para obter o cargo ${targetRole.name}, você precisa adicionar o seguinte texto em seu status personalizado do Discord:\n\n**${statusConfig.requiredText}**\n\nPara definir um status personalizado:\n1. Clique no seu nome/avatar no Discord\n2. Clique em "Definir Status Personalizado"\n3. Digite o texto obrigatório\n4. Salve e clique no botão novamente.`,
                    colors.error
                );
                
                await interaction.reply({ embeds: [noTextEmbed], ephemeral: true });
            }
            
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            
            const errorEmbed = createYakuzaEmbed(
                'Erro na Verificação',
                'Ocorreu um erro ao verificar seu status. Tente novamente.',
                colors.error
            );
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    // Sistema de monitoramento de status
    addUserToMonitoring(userId, guildId, requiredText, roleId) {
        const serverConfig = getServerConfig(guildId);
        if (!serverConfig.statusChecker.monitoredUsers) {
            serverConfig.statusChecker.monitoredUsers = {};
        }
        
        serverConfig.statusChecker.monitoredUsers[userId] = {
            requiredText,
            roleId,
            addedAt: Date.now()
        };
        
        setServerConfig(guildId, serverConfig);
    },

    // Função para lidar com modals
    async handleModalSubmit(interaction, client, config, colors, createYakuzaEmbed) {
        const { customId } = interaction;
        
        if (customId.startsWith('embed_config_')) {
            const type = customId.split('_')[2]; // 'mute' ou 'ban'
            
            const title = interaction.fields.getTextInputValue('embed_title') || null;
            const description = interaction.fields.getTextInputValue('embed_description');
            const colorHex = interaction.fields.getTextInputValue('embed_color') || '#ff0000';
            
            // Converter cor hex para número
            let color = 0xff0000;
            try {
                color = parseInt(colorHex.replace('#', ''), 16);
            } catch (e) {
                color = 0xff0000;
            }
            
            // Salvar configuração
            const serverConfig = getServerConfig(interaction.guild.id);
            serverConfig.embedConfigs[type] = {
                title,
                description,
                color
            };
            setServerConfig(interaction.guild.id, serverConfig);
            
            const successEmbed = createYakuzaEmbed(
                'Configuração Salva',
                `A embed de ${type} foi configurada com sucesso!`,
                colors.success
            );
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            
        } else if (customId === 'status_config_text_modal') {
            const requiredText = interaction.fields.getTextInputValue('required_text');
            
            const serverConfig = getServerConfig(interaction.guild.id);
            serverConfig.statusChecker.requiredText = requiredText;
            setServerConfig(interaction.guild.id, serverConfig);
            
            const successEmbed = createYakuzaEmbed(
                'Texto Configurado',
                `Texto obrigatório definido como: ${requiredText}`,
                colors.success
            );
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            
        } else if (customId === 'status_config_role_modal') {
            const roleId = interaction.fields.getTextInputValue('role_id');
            
            // Verificar se o cargo existe e é seguro
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                const errorEmbed = createYakuzaEmbed(
                    'Cargo Não Encontrado',
                    'O ID do cargo fornecido não é válido ou o cargo não existe.',
                    colors.error
                );
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            // Verificar se é um cargo perigoso (administrador, etc.)
            if (role.permissions.has(PermissionFlagsBits.Administrator) || 
                role.permissions.has(PermissionFlagsBits.ManageGuild) ||
                role.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const dangerousRoleEmbed = createYakuzaEmbed(
                    'Cargo Perigoso',
                    'Este cargo possui permissões administrativas e não pode ser usado no Status Checker por motivos de segurança.',
                    colors.error
                );
                return interaction.reply({ embeds: [dangerousRoleEmbed], ephemeral: true });
            }
            
            // Verificar se o bot pode gerenciar este cargo
            const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
            if (role.position >= botMember.roles.highest.position) {
                const hierarchyEmbed = createYakuzaEmbed(
                    'Hierarquia Insuficiente',
                    'O cargo do bot deve estar acima do cargo configurado para poder gerenciá-lo.',
                    colors.error
                );
                return interaction.reply({ embeds: [hierarchyEmbed], ephemeral: true });
            }
            
            const serverConfig = getServerConfig(interaction.guild.id);
            serverConfig.statusChecker.roleId = roleId;
            setServerConfig(interaction.guild.id, serverConfig);
            
            const successEmbed = createYakuzaEmbed(
                'Cargo Configurado',
                `Cargo definido como: ${role.name}`,
                colors.success
            );
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            
        } else if (customId === 'status_config_channel_modal') {
            const channelId = interaction.fields.getTextInputValue('channel_id');
            
            // Verificar se o canal existe
            const channel = interaction.guild.channels.cache.get(channelId);
            if (!channel) {
                const errorEmbed = createYakuzaEmbed(
                    'Canal Não Encontrado',
                    'O ID do canal fornecido não é válido ou o canal não existe.',
                    colors.error
                );
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            const serverConfig = getServerConfig(interaction.guild.id);
            serverConfig.statusChecker.channelId = channelId;
            setServerConfig(interaction.guild.id, serverConfig);
            
            const successEmbed = createYakuzaEmbed(
                'Canal Configurado',
                `Canal definido como: ${channel.name}`,
                colors.success
            );
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            
        } else if (customId === 'status_embed_config_modal') {
            const title = interaction.fields.getTextInputValue('status_embed_title') || null;
            const description = interaction.fields.getTextInputValue('status_embed_description');
            const image = interaction.fields.getTextInputValue('status_embed_image') || null;
            const thumbnail = interaction.fields.getTextInputValue('status_embed_thumbnail') || null;
            
            const serverConfig = getServerConfig(interaction.guild.id);
            serverConfig.statusChecker.embedConfig = {
                title,
                description,
                image,
                thumbnail
            };
            setServerConfig(interaction.guild.id, serverConfig);
            
            // Verificar se tudo está configurado para ativar o sistema
            const statusConfig = serverConfig.statusChecker;
            if (statusConfig.requiredText && statusConfig.roleId && statusConfig.channelId && statusConfig.embedConfig.description) {
                statusConfig.enabled = true;
                setServerConfig(interaction.guild.id, serverConfig);
                
                // Enviar a embed no canal configurado
                await this.sendStatusCheckerEmbed(interaction, serverConfig, colors, createYakuzaEmbed);
            }
            
            const successEmbed = createYakuzaEmbed(
                'Embed Configurada',
                'A embed foi configurada com sucesso!' + (statusConfig.enabled ? '\n\nO Status Checker foi ativado e a embed foi enviada no canal configurado!' : ''),
                colors.success
            );
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
    },
    
    async sendStatusCheckerEmbed(interaction, serverConfig, colors, createYakuzaEmbed) {
        const statusConfig = serverConfig.statusChecker;
        const channel = interaction.guild.channels.cache.get(statusConfig.channelId);
        
        if (!channel) return;
        
        const embed = createYakuzaEmbed(
            statusConfig.embedConfig.title || 'Obter Cargo',
            statusConfig.embedConfig.description,
            colors.accent
        );
        
        if (statusConfig.embedConfig.image) {
            embed.setImage(statusConfig.embedConfig.image);
        }
        
        if (statusConfig.embedConfig.thumbnail) {
            embed.setThumbnail(statusConfig.embedConfig.thumbnail);
        }
        
        const button = new ButtonBuilder()
            .setCustomId('obter_cargo')
            .setLabel('Obter Cargo')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('');
            
        const actionRow = new ActionRowBuilder().addComponents(button);
        
        await channel.send({ embeds: [embed], components: [actionRow] });
    }
};