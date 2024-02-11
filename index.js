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
exports.talk = exports.stablediff = exports.generateImage = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = __importStar(require("discord.js"));
const dotenv_1 = __importDefault(require("dotenv"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const gptAI_1 = require("./gptAI");
const ytpl_1 = __importDefault(require("ytpl"));
const youtube_search_1 = __importDefault(require("youtube-search"));
const fs = __importStar(require("fs"));
const speech_1 = require("@google-cloud/speech");
const prism_media_1 = require("prism-media");
const WavEncoder = require("wav-encoder");
dotenv_1.default.config();
var working = false;
var stablediff = false;
exports.stablediff = stablediff;
var previousPrompt = '';
const omniKey = process.env.OMNIKEY;
var queue = [];
const player = (0, voice_1.createAudioPlayer)();
var alreadyplaying = false;
const speechClient = new speech_1.SpeechClient({
    projectId: 'steel-bliss-403523',
    keyFilename: './dolphin.json',
});
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
client.login(process.env.TOKEN);
const voiceDiscord = require('@discordjs/voice');
const { createAudioResource, AudioPlayerStatus, joinVoiceChannel, EndBehaviorType, VoiceConnectionStatus } = require('@discordjs/voice');
function talk(text, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var sdk = require("microsoft-cognitiveservices-speech-sdk");
        var readline = require("readline");
        var audioFile = "audiofile.wav";
        // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURETOKEN, process.env.AZUREREGION);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
        // The language of the voice that speaks.
        var speechSynthesisVoiceName = "en-US-JaneNeural";
        var ssml = `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'> \r\n \
        <voice name='${speechSynthesisVoiceName}'> \r\n \
            <prosody pitch="8%" rate="15%">\r\n \
            ${text} \r\n \
            </prosody>\r\n \
        </voice> \r\n \
    </speak>`;
        var speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        console.log(`SSML to synthesize: \r\n ${ssml}`);
        console.log(`Synthesize to: ${audioFile}`);
        yield speechSynthesizer.speakSsmlAsync(ssml, function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("SynthesizingAudioCompleted result");
            }
            else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            speechSynthesizer.close();
            speechSynthesizer = null;
        }, function (err) {
            console.trace("err - " + err);
            speechSynthesizer.close();
            speechSynthesizer = null;
        });
        playAudio(message);
    });
}
exports.talk = talk;
function record(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const channel = message.member.voice.channel;
        const connection = voiceDiscord.joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });
        const receiver = connection.receiver.subscribe('631556720338010143', { end: { behavior: EndBehaviorType.AfterSilence, duration: 100 } });
        const decoder = new prism_media_1.opus.Decoder({ frameSize: 960 * 2, channels: 1, rate: 48000 });
        const stream = receiver.pipe(decoder).pipe(fs.createWriteStream("./test.pcm"));
        stream.on("finish", () => {
            console.log('encoding');
            var wavConverter = require('wav-converter');
            var fs = require('fs');
            var path = require('path');
            var pcmData = fs.readFileSync(path.resolve(__dirname, './test.pcm'));
            var wavData = wavConverter.encodeWav(pcmData, {
                numChannels: 1,
                sampleRate: 48000
            });
            fs.writeFileSync(path.resolve(__dirname, './converted.wav'), wavData);
            console.log('done writing, logging');
            checkforMela(message);
        });
    });
}
function checkforMela(message) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const filename = 'converted.wav';
        const encoding = 'LINEAR16';
        const sampleRateHertz = 48000;
        const languageCode = 'en-US';
        const config = {
            encoding: encoding,
            languageCode: languageCode,
            enableAutomaticPunctuation: true,
            sampleRateHertz: sampleRateHertz
        };
        const audio = {
            content: fs.readFileSync(filename).toString('base64'),
        };
        const request = {
            config: config,
            audio: audio,
        };
        // Detects speech in the audio file
        const [response] = yield speechClient.recognize(request);
        const transcription = (_a = response.results) === null || _a === void 0 ? void 0 : _a.map(result => result.alternatives)[0];
        const final = transcription === null || transcription === void 0 ? void 0 : transcription.map(a => a.transcript)[0];
        console.log(final);
        if ((final === null || final === void 0 ? void 0 : final.toLocaleLowerCase().startsWith('mella')) || (final === null || final === void 0 ? void 0 : final.toLocaleLowerCase().startsWith('mela')) || (final === null || final === void 0 ? void 0 : final.toLocaleLowerCase().startsWith("hey, mela")) || (final === null || final === void 0 ? void 0 : final.toLocaleLowerCase().startsWith("hey mela"))) {
            (0, gptAI_1.askGpt)(message, final, true);
        }
        else if (final != null) {
            (0, gptAI_1.askGpt)(message, final, true);
        }
    });
}
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
                        const songInfo = yield ytdl_core_1.default.getInfo(songUrl, options);
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
                    const songInfo = yield ytdl_core_1.default.getInfo(link, options);
                    const song = {
                        songNumber: 'null',
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url
                    };
                    queue.push(song);
                    if (queue.length === 1) {
                        playSong(channel, message, options);
                    }
                    message.reply({
                        content: `Added ${link} to the queue 😃`
                    });
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
function playAudio(message) {
    return __awaiter(this, void 0, void 0, function* () {
        var channel = message.member.voice.channel;
        if (!channel) {
            return message.reply("Oh, my sultry lover, you must be in a voice channel to talk with me.");
        }
        const connection = voiceDiscord.joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        setTimeout(function () {
            return __awaiter(this, void 0, void 0, function* () {
                const dispatcher = createAudioResource('audiofile.wav');
                connection.subscribe(player);
                player.play(dispatcher);
            });
        }, 1000);
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
    else if (command === 'reset') {
        (0, gptAI_1.resetAI)();
        message.reply({
            content: "Successfully cleared memory"
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
            1. "!p play *link*" \n
            2. "!p queue" \n
            3. "!p resume" \n
            4. "!p skip" \n
            5. "!p queue" \n
            6. "!p goto *number* \n
            **To chat with me, please use #chatting-with-mela, ping me in any other channel or simply reply to my message** \n
            For image generation please use: \n
            1. "Can you please generate *prompt here*" - use those for anime styled generations \n
            2. "Can you please generate real *prompt here*" - use those for realistic generations \n
            3. "Can you show me what you look like?" - use those for me showing you a picture of me 😉 `)
            .setColor('#78E3CC');
        message.reply({
            embeds: [helpEmbed]
        });
    }
    else if (command.startsWith("AI")) {
        if (message.author.id === '631556720338010143') {
            if (stablediff == false) {
                exports.stablediff = stablediff = true;
            }
            else
                (exports.stablediff = stablediff = false);
            console.log('Stable Diffusion generation set to ' + stablediff.toString());
            message.reply({
                content: 'Stable Diffusion generation set to ' + stablediff.toString()
            });
        }
        else {
            message.reply({
                content: "You don't have the permissions to do that"
            });
        }
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
    else if (command.startsWith('talk')) {
        command = command.replace('talk ', '');
        (0, gptAI_1.askGpt)(message, command, true);
    }
    else if (command === 'record') {
        record(message);
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
    else if (command === 'counter') {
        var check = fs.readFileSync('itis.txt', 'utf8');
        message.reply({
            content: `It is what it is counter: ${check}`
        });
    }
    else if (command === 'communism') {
        runCommand(message, 'play https://www.youtube.com/playlist?list=PLEC9z34CbIByfimg9B_9Ti8K4NXrBRH0X');
    }
    else if (command.startsWith('gpt')) {
        command = command.replace('gpt ', '');
        (0, gptAI_1.askGptNoH)(message, command, false);
    }
    else if (command.startsWith('remove')) {
        var index = parseInt(command.replace('remove ', ''));
        removeSong(message, index);
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
    queue = queue.splice(index - 1, 1);
    message.reply({
        content: `Removed the song at ${index}`
    });
}
function itwit(message, reply) {
    var check = fs.readFileSync('itis.txt', 'utf8');
    var newnumber = +check;
    newnumber++;
    writeFile(newnumber.toString(), 'itis.txt');
    if (reply) {
        message.reply({
            content: `It is what it is counter: ${newnumber}`
        });
    }
}
function writeFile(content, file) {
    fs.writeFileSync(file, content);
}
client.on('messageCreate', (message) => {
    //console.log(message.content)!
    if (!message.content.startsWith(`!m play`)) {
        message.content = message.content.toLowerCase();
    }
    if (message.author === client.user || message.content.startsWith('.')) {
        //Do nothing
        return;
    }
    if (message.content.startsWith('!m')) {
        runCommand(message, message.content.replace("!m ", ""));
    }
});
client.on('ready', () => {
    (0, gptAI_1.resetAI)();
    console.log('The bot is ready');
});
var myUrl = 'http://api.omniinfer.io/v2/txt2img';
var lastReal = false;
function generateImage(message, prompt, realism) {
    return __awaiter(this, void 0, void 0, function* () {
        previousPrompt = prompt;
        lastReal = realism;
        message.channel.sendTyping();
        console.log(prompt);
        if (realism) {
            var model = 'majicmixRealistic_v2';
        }
        else {
            var model = 'meinamix_meinaV6_13129';
        }
        var content = `{
        "prompt": "(masterpiece, best quality:1.2), ${prompt}",
        "negative_prompt": "worst quality, low quality, monochrome",
        "model_name": "${model}.safetensors",
        "sampler_name": "DPM++ 2M Karras",
        "batch_size": 1,
        "n_iter": 1,
        "steps": 20,
        "enable_hr": true,
        "hr_scale": 1.8,
        "denoising_strength": 0.55,
        "hr_second_pass_steps": 10,
        "cfg_scale": 7,
        "seed": -1,
        "height": 768,
        "width": 512
    }`;
        const response = yield fetch(myUrl, {
            method: 'POST',
            body: content,
            headers: { 'User-Agent': 'Apifox/1.0.0 (https://www.apifox.cn)',
                'Content-Type': 'application/json',
                'X-Omni-Key': `${omniKey}` }
        });
        const bodyS = yield response.json();
        console.log(bodyS);
        const ID = bodyS.data.task_id;
        console.log(ID);
        getImage(message, ID);
    });
}
exports.generateImage = generateImage;
function getImage(message, taskID) {
    return __awaiter(this, void 0, void 0, function* () {
        const myURL = 'http://api.omniinfer.io/v2/progress?task_id=' + taskID;
        setTimeout(function () {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    message.channel.sendTyping();
                    const responseImage = yield fetch(myURL, {
                        method: 'GET',
                        headers: { 'User-Agent': 'Apifox/1.0.0 (https://www.apifox.cn)',
                            'X-Omni-Key': `${omniKey}` }
                    });
                    const bodyImage = yield responseImage.json();
                    const imageURL = bodyImage.data.imgs[0];
                    console.log(imageURL);
                    message.reply({
                        content: imageURL
                    });
                }
                catch (_a) {
                    try {
                        setTimeout(function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                message.channel.sendTyping();
                                const responseImage = yield fetch(myURL, {
                                    method: 'GET',
                                    headers: { 'User-Agent': 'Apifox/1.0.0 (https://www.apifox.cn)',
                                        'X-Omni-Key': `${omniKey}` }
                                });
                                const bodyImage = yield responseImage.json();
                                const imageURL = bodyImage.data.imgs[0];
                                console.log(imageURL);
                                message.reply({
                                    content: imageURL
                                });
                            });
                        }, 10000);
                    }
                    catch (_b) {
                        try {
                            message.channel.sendTyping();
                            setTimeout(function () {
                                return __awaiter(this, void 0, void 0, function* () {
                                    const responseImage = yield fetch(myURL, {
                                        method: 'GET',
                                        headers: { 'User-Agent': 'Apifox/1.0.0 (https://www.apifox.cn)',
                                            'X-Omni-Key': `${omniKey}` }
                                    });
                                    const bodyImage = yield responseImage.json();
                                    const imageURL = bodyImage.data.imgs[0];
                                    console.log(imageURL);
                                    message.reply({
                                        content: imageURL
                                    });
                                });
                            }, 10000);
                        }
                        catch (_c) {
                            message.reply({
                                content: 'Sorry, that image generation took too long to respond - try a different image'
                            });
                        }
                    }
                }
            });
        }, 10000);
    });
}
