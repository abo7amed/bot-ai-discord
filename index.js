const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const IS_EMBED = process.env.IS_EMBED;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

let data;

const loadData = () => {
    try {
        const jsonData = fs.readFileSync('data.json', 'utf8');
        data = JSON.parse(jsonData);
        console.log('✅ تم تحميل ملف البيانات بنجاح.');
    } catch (error) {
        console.error('❌ خطأ في تحميل ملف البيانات:', error);
        data = [];
    }
};

client.once('ready', () => {
    console.log(`البوت شغال ${client.user.tag}`);
    loadData();
});

client.on('messageCreate', async message => {
    if (message.author.bot || message.content.trim() === '') return;
    
    if (message.channel.id !== CHANNEL_ID) return;

    // حد للتطابق (0.0 - 1.0)
    const threshold = 0.7; // هنا اذا تبي تطابق بنفس السوال بالضبط حط 1.0 ولاكن افضل شي 0.7 
    let bestMatch = null;

    for (const entry of data) {
        const questions = Array.isArray(entry.question) ? entry.question : [entry.question];

        for (const question of questions) {
            const similarity = stringSimilarity.compareTwoStrings(message.content, question);
            if (similarity > threshold) {
                if (!bestMatch || similarity > bestMatch.similarity) {
                    bestMatch = {
                        similarity,
                        answer: entry.answer
                    };
                }
            }
        }
    }

    if (bestMatch) {
        if (IS_EMBED === '1') {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(bestMatch.answer);
            message.reply({ embeds: [embed] });
        } else if (IS_EMBED === '2') {
            message.reply(bestMatch.answer);
        }
    } else {
        if (IS_EMBED === '1') {
            const noMatchEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription('سوالك عير مفهوم حاول تقوله بصيغه احسن لاهنت؟');
            message.reply({ embeds: [noMatchEmbed] });
        } else if (IS_EMBED === '2') {
            message.reply('سوالك عير مفهوم حاول تقوله بصيغه احسن لاهنت؟');
        }
    }
});

client.login(DISCORD_TOKEN);