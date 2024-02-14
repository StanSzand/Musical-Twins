"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const discord_js_1 = __importStar(require("discord.js"));
const dotenv_1 = __importDefault(require("dotenv"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const ytpl_1 = __importDefault(require("ytpl"));
const youtube_search_1 = __importDefault(require("youtube-search"));
const fetch = require('node-fetch');
dotenv_1.default.config();
var usersArray = ['631556720338010143', '387668927418990593']; //Stan + Sean
var queue = [];
const player = (0, voice_1.createAudioPlayer)();
var alreadyplaying = false;
//Discord JS
const client = new discord_js_1.default.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildVoiceStates
    ]
});
const spotifyID = process.env.CLIENTIDSPOTIFY;
const spotifySECRET = process.env.CLIENTSECRETSPOTIFY;
client.login(process.env.TOKEN);
const voiceDiscord = require('@discordjs/voice');
const { createAudioResource, AudioPlayerStatus, joinVoiceChannel, EndBehaviorType, VoiceConnectionStatus } = require('@discordjs/voice');
function startPlay(message, link) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Added <${link}> to the queue`);
        const fakeCookie = process.env.YTCOOKIE;
        // Add the fake cookie to the options when calling ytdl
        const options = {
            filter: "audioonly",
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            requestOptions: {
                headers: {
                    cookie: fakeCookie,
                }
            }
        };
        var channel = message.member.voice.channel;
        if (channel) {
            try {
                if (link.includes('playlist')) {
                    const playlist = yield (0, ytpl_1.default)(link);
                    const songUrls = playlist.items.map((item) => item.url);
                    for (const songUrl of songUrls) {
                        const songInfo = yield ytdl_core_1.default.getInfo(songUrl);
                        const song = {
                            songNumber: 'null',
                            title: songInfo.videoDetails.title,
                            url: songInfo.videoDetails.video_url
                        };
                        queue.push(song);
                        if (queue.length === 1) {
                            playSong(channel, message, options);
                        }
                    }
                }
                else {
                    const songInfo = yield ytdl_core_1.default.getInfo(link);
                    const song = {
                        songNumber: 'null',
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url
                    };
                    queue.push(song);
                    if (queue.length === 1) {
                        playSong(channel, message, options);
                    }
                }
            }
            catch (error) {
                message.reply({
                    content: `That link is invalid, please make sure it is not age restricted or in a private playlist - ${error}`
                });
            }
        }
        else {
            message.channel.send("You need to be in a voice channel to use this command, darling.");
        }
    });
}
function searchSong(message, songname) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchResults = yield (0, youtube_search_1.default)(songname, {
            maxResults: 1,
            key: process.env.YOUTUBE_API_KEY, // Remember to set your YouTube API key in the .env file
        });
        const videoUrl = searchResults.results[0].link;
        startPlay(message, videoUrl);
    });
}
function playSong(voiceChannel, message, options) {
    return __awaiter(this, void 0, void 0, function* () {
        var channel = message.member.voice.channel;
        const connection = voiceDiscord.joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });
        const stream = (0, ytdl_core_1.default)(queue[0].url, options);
        const dispatcher = createAudioResource(stream);
        connection.subscribe(player);
        player.play(dispatcher);
        if (!alreadyplaying) {
            player.addListener("stateChange", (oldOne, newOne) => {
                if (newOne.status == "idle") {
                    queue.shift();
                    if (queue.length > 0) {
                        alreadyplaying = true;
                        playSong(voiceChannel, message, options);
                    }
                    else {
                        try {
                            if (connection) {
                                connection.destroy();
                                player.removeAllListeners();
                            }
                        }
                        catch (error) {
                            console.log(error);
                        }
                    }
                }
            });
        }
    });
}
//Commands
function runCommand(message, command) {
    if (command === 'ping') {
        message.reply({
            content: `🏓Latency is ${Date.now() - message.createdTimestamp}ms`
        });
    }
    else if (command.startsWith('play')) {
        command = command.replace('play ', '');
        if (command.includes('youtube.com') || command.includes('youtu.be')) {
            if (command.includes('&')) {
                command = command.split('&')[0];
            }
            startPlay(message, command);
        }
        else {
            searchSong(message, command);
        }
    }
    else if (command.startsWith('help')) {
        const helpEmbed = new discord_js_1.EmbedBuilder()
            .setTitle("I see you requested for help, here you are:")
            .setDescription(`Here are the music commands: \n 
            1. "!play *link*" \n
            2. "!queue" \n
            3. "!resume" \n
            4. "!skip" \n
            5. "!queue" \n
            6. "!goto *number* \n
            7. "!remove *number* \n`)
            .setColor('#78E3CC');
        message.reply({
            embeds: [helpEmbed]
        });
    }
    else if (command === 'queue') {
        try {
            console.log(queue);
            for (let i = 0; i < queue.length; i++) {
                if (i === 0) {
                    queue[i].songNumber = `${i + 1} Now Playing:     `;
                }
                else if (i === 1) {
                    queue[i].songNumber = `${i + 1} Next up:     `;
                }
                else {
                    queue[i].songNumber = `${i + 1}:    `;
                }
            }
            console.log(queue);
            // if (queue.length > 30){
            //     const queueEmbed = new EmbedBuilder()
            //     .setTitle("🎵 Music Queue 🎵")
            //     .setDescription(queue.slice(0,30).map(song => `**${song.songNumber}** ${song.title} - ${song.url}`).join('\n'))
            //     .setColor('#FF0000')
            // message.reply({
            //     embeds: [queueEmbed] 
            // })
            // }else{
            const queueEmbed = new discord_js_1.EmbedBuilder()
                .setTitle("🎵 Music Queue 🎵")
                .setDescription(queue.map(song => `**${song.songNumber}** ${song.title}`).join('\n'))
                .setColor('#FF0000');
            message.reply({
                embeds: [queueEmbed]
            });
            // }
        }
        catch (error) {
            message.reply({
                content: `The queue seems to be empty. 😔    - ${error}`
            });
            console.log(error);
        }
    }
    else if (command === 'pause') {
        pauseSong();
        message.reply({
            content: "Song paused darling, embrace the silence. 😈😉"
        });
    }
    else if (command === 'resume') {
        resumeSong();
        message.reply({
            content: "Song resumed 😊"
        });
    }
    else if (command === 'skip') {
        skipSong();
        message.reply({
            content: "You don't like that one huh? 🤔 Skipped it for you. 🥰"
        });
    }
    else if (command.startsWith('goto')) {
        try {
            var intiger = parseInt(command.replace('goto ', ''));
            goTo(intiger - 2);
            message.reply({
                content: `Skipped to number ${intiger}.`
            });
        }
        catch (error) {
            console.log(error);
            message.reply({
                content: `An error occured while skipping.`
            });
        }
    }
    else if (command === 'shuffle') {
        queue = shuffleArray(queue);
        message.reply({
            content: "Shuffled your playlist."
        });
    }
    else if (command === 'leave') {
        leave();
        message.reply({
            content: 'You should have no songs left in the queue now'
        });
    }
    else if (command === 'nazi') {
        runCommand(message, 'play https://www.youtube.com/playlist?list=PLYoXHNEbv4vwMVlpw4Kbxcj7j2I3JNX3X');
    }
    else if (command === 'np') {
        nowPlaying(message);
    }
    else if (command === 'communism') {
        runCommand(message, 'play https://www.youtube.com/playlist?list=PLEC9z34CbIByfimg9B_9Ti8K4NXrBRH0X');
    }
    else if (command.startsWith('remove')) {
        var index = parseInt(command.replace('remove ', ''));
        removeSong(message, index);
    }
    else if (command === 'memes') {
        runCommand(message, 'play https://www.youtube.com/playlist?list=PLYoXHNEbv4vz--SK614bGWbp9MtLu-1FZ');
    }
}
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 1; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function leave() {
    queue = [];
    skipSong();
}
function pauseSong() {
    player.pause();
}
function nowPlaying(message) {
    const reply = `Now playing ${queue[0].title}`;
    message.reply({
        content: reply
    });
}
function resumeSong() {
    player.unpause();
}
function skipSong() {
    player.stop();
}
function goTo(index) {
    queue = queue.splice(index);
    skipSong();
}
function removeSong(message, index) {
    queue.splice(index - 1, 1);
    message.reply({
        content: `Removed the song at ${index}`
    });
}
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    //console.log(message.content)!
    // if (!message.content.startsWith(`!play`)){
    //     message.content = message.content.toLowerCase()
    // }
    if (!message.content.startsWith(`!play`) && !message.content.startsWith(`!h play`)) {
        message.content = message.content.toLowerCase();
    }
    if (message.author === client.user || message.content.startsWith('.') || message.author.id.startsWith('1075173399342629024')) {
        //Do nothing
        return;
    }
    if (message.content.startsWith('!') && !usersArray.includes(message.author.id)) {
        if (message.content.startsWith("!play") && message.content.includes("spotify")) {
            const query = message.content.replace("!play ", "").replace("https://open.spotify.com/playlist/", "").split("?si")[0];
            console.log(query);
            yield getPlaylistItems(message, query);
            message.reply({
                content: "Added " + message.content.replace('!play', '') + " to the queue"
            });
        }
        else {
            runCommand(message, message.content.replace("!", ""));
        }
    }
    else if (message.content.startsWith('!h') && usersArray.includes(message.author.id)) {
        if (message.content.startsWith("!h play ") && message.content.includes("spotify")) {
            const query = message.content.replace("!h play ", "").replace("https://open.spotify.com/playlist/", "").split("?si")[0];
            console.log(query);
            yield getPlaylistItems(message, query);
            message.reply({
                content: "Added " + message.content.replace('!play', '') + " to the queue"
            });
        }
        else {
            runCommand(message, message.content.replace("!h", ""));
        }
    }
}));
function getPlaylistItems(message, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const code = yield fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=client_credentials&client_id=${spotifyID}&client_secret=${spotifySECRET}`
        });
        var songs = [];
        const bodyS = yield code.json();
        const token = bodyS.access_token;
        const response = yield fetch(`https://api.spotify.com/v1/playlists/${query}/tracks`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = yield response.json();
        //console.log(data.items[1].track.artists)
        //console.log(data)
        for (let i = 0; i < Object.keys(data.items).length; i++) {
            var artists = '';
            for (let j = 0; j < Object.keys(data.items[i].track.artists).length; j++) {
                if (j > 0) {
                    artists += ", ";
                }
                artists += data.items[i].track.artists[j].name + "";
                //console.log(data.items[i].track.artists[j].name)
            }
            var object = "play " + artists + " - " + data.items[i].track.name;
            runCommand(message, object);
        }
        console.log(songs);
    });
}
client.on('ready', () => {
    console.log('The bot is ready');
});
