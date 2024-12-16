const { getGroupSettings } = require('../../Mongodb/Settingsdb');
const ownerMiddleware = require('../../Middleware/ownerMiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args } = context;
        const value = args[0]?.toLowerCase();
        const jid = m.chat;

        if (!jid.endsWith('@g.us')) {
            return await m.reply('❌ This command can only be used in groups.');
        }

        let groupSettings = await getGroupSettings(jid);

        if (!groupSettings) {
            const GroupSettings = require('../../Mongodb/Schemas/groupSettingsSchema');
            groupSettings = new GroupSettings({ jid });
            await groupSettings.save();
        }

        const Myself = await client.decodeJid(client.user.id);

        let groupMetadata = await client.groupMetadata(m.chat);
        let userAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);

        const isBotAdmin = userAdmins.includes(Myself);

        if (value === 'on' && !isBotAdmin) {
            return await m.reply('❌ I need admin privileges to handle antitag.');
        }

        if (value === 'on' || value === 'off') {
            const action = value === 'on' ? true : false;
            const actionText = value === 'on' ? 'ON' : 'OFF';
            const actionMsg = value === 'on' ? 'turned ON' : 'turned OFF';

            if (groupSettings.antitag === action) {
                return await m.reply(`✅ Antitag was already ${actionText}.`);
            }

            groupSettings.antitag = action;
            await groupSettings.save();

            if (value === 'on') {
                await m.reply(`✅ Antitag has been ${actionMsg} for this group. Bot will now remove members tagging and hidetagging.`);
            } else {
                await m.reply(`❌ Antitag has been ${actionMsg} for this group.`);
            }
        } else {
            await m.reply(`📄 Current Antitag setting for this group: ${groupSettings.antitag ? 'ON' : 'OFF'}\n\nUse "antitag on" or "antitag off".`);
        }
    });
};