import { PlayerSubscription, createAudioPlayer } from '@discordjs/voice'
import DiscordJS, { Client, EmbedBuilder, GatewayIntentBits, Guild, VoiceChannel } from 'discord.js'
import dotenv from 'dotenv'
import ytdl from 'ytdl-core';
import ytpl from 'ytpl'
import search from 'youtube-search'

dotenv.config()

var queue:any[] = []
const player = createAudioPlayer()
var alreadyplaying = false

const voiceDiscord = require('@discordjs/voice')
const { createAudioResource, AudioPlayerStatus,  joinVoiceChannel, EndBehaviorType, VoiceConnectionStatus  } = require('@discordjs/voice')

//Discord JS
const client = new DiscordJS.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
})

client.login(process.env.discordAPI)




async function startPlay(message: any, link: string){
    console.log(`Added <${link}> to the queue`)
    const fakeCookie = process.env.YTCOOKIE

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
}
    var channel = message.member.voice.channel;
    if (channel) {
        try{

            if (link.includes('playlist')){
                const playlist = await ytpl(link);
                const songUrls = playlist.items.map((item) => item.url);

                for (const songUrl of songUrls) {
                    const songInfo = await ytdl.getInfo(songUrl, options);
                    const song = {
                        songNumber: 'null', 
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url
                      }
                      queue.push(song)
                      if (queue.length === 1) {
                        playSong(channel, message, options)
                    }
                }
                
            }else{


                const songInfo = await ytdl.getInfo(link, options)
                
                const song = {
                    songNumber: 'null', 
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url
                }


                queue.push(song)
            
                if (queue.length === 1) {
                    playSong(channel, message, options)
                    console.log("playsong went through")
                }

                message.reply({
                    content: `Added ${link} to the queue 😃`
                })
            }
        }catch(error){
                message.reply({
                    content: `That link is invalid, please make sure it is not age restricted or in a private playlist - ${error}`
                })
            }
            
            
        }else{
            message.channel.send("You need to be in a voice channel to use this command, darling.");
        }
        
 }
        
async function searchSong(message: any, songname: string){
    const searchResults = await search(songname, {
        maxResults: 1,
        key: process.env.YOUTUBE_API_KEY, 
      });
    const videoUrl = searchResults.results[0].link

    startPlay(message, videoUrl)
    
}




async function playSong(voiceChannel: any, message: any, options: any) {
    var channel = message.member.voice.channel;


    const connection = voiceDiscord.joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
    })
    
    console.log(connection)

    const stream = ytdl(queue[0].url, options)



    const dispatcher = createAudioResource(stream)

    connection.subscribe(player)

    player.play(dispatcher)

    

    if (!alreadyplaying){
        player.addListener("stateChange", (oldOne, newOne) => {
            if (newOne.status == "idle") {
                console.log(queue.length + " Before")
                queue.shift();
                console.log(queue.length + " After")
                if (queue.length > 0) {
                    alreadyplaying = true 
                    playSong(voiceChannel, message, options);
                } else {
                    try{
                        if(connection){
                            connection.destroy()
                            player.removeAllListeners()
                        }
                         
                    }catch(error){
                        console.log(error)
                    }
                }
            }
        })
    }
    ;

        
        
}


//Commands
function runCommand(message: any, command: string){
    if (command === 'ping'){
        message.reply({
            content: `🏓Latency is ${Date.now() - message.createdTimestamp}ms`
        })
    
    }else if (command.startsWith('play')){
            command = command.replace('play ', '')
            if(command.includes('youtube.com') || command.includes('youtu.be')){
                if(command.includes('&')){
                    command = command.split('&')[0]
                }
                startPlay(message, command)
            }else{
                searchSong(message, command)
            }
            
    }else if (command.startsWith('help')){
            const helpEmbed = new EmbedBuilder()
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
            .setColor('#78E3CC')

            message.reply({
                embeds: [helpEmbed]
            })

    }else if (command === 'queue'){
        try{
            console.log(queue)
            for (let i = 0; i < queue.length; i++){
                if(i === 0){
                    queue[i].songNumber = `${i+1} Now Playing:     `
                }else if(i === 1){
                    queue[i].songNumber = `${i+1} Next up:     `
                }else{
                    queue[i].songNumber = `${i+1}:    `
                }
            }
            
            console.log(queue)
            // if (queue.length > 30){
            //     const queueEmbed = new EmbedBuilder()
            //     .setTitle("🎵 Music Queue 🎵")
            //     .setDescription(queue.slice(0,30).map(song => `**${song.songNumber}** ${song.title} - ${song.url}`).join('\n'))
            //     .setColor('#FF0000')

            // message.reply({
            //     embeds: [queueEmbed] 
            // })
            // }else{
                const queueEmbed = new EmbedBuilder()
                .setTitle("🎵 Music Queue 🎵")
                .setDescription(queue.map(song => `**${song.songNumber}** ${song.title}`).join('\n'))
                .setColor('#FF0000')

                message.reply({
                    embeds: [queueEmbed]
                })
            // }
            
        }catch(error){
            message.reply({
                content: `The queue seems to be empty. 😔    - ${error}`  
            })
            console.log(error)
        }
        
    }else if (command === 'pause'){
        pauseSong()
        message.reply({
            content: "Song paused darling, embrace the silence. 😈😉"
        })
    }else if (command === 'resume'){
        resumeSong()
        message.reply({
            content: "Song resumed 😊"
        })
    }else if (command === 'skip'){
        skipSong()
        message.reply({
            content: "You don't like that one huh? 🤔 Skipped it for you. 🥰"
        })
    }else if (command.startsWith('goto')){
        try{
            var intiger = parseInt(command.replace('goto ',''))
            goTo(intiger-2)
            message.reply({
                content: `Skipped to number ${intiger}.`
            })
        }catch(error){
            console.log(error)
            message.reply({
                content: `An error occured while skipping.`
            })
        }
    }else if(command === 'shuffle'){
        queue = shuffleArray(queue)
        message.reply({
            content: "Shuffled your playlist."
        })
    }else if (command === 'leave'){
        leave()
        message.reply({
            content: 'You should have no songs left in the queue now'
        })
    }else if (command === 'nazi'){
        runCommand(message, 'play https://www.youtube.com/playlist?list=PLYoXHNEbv4vwMVlpw4Kbxcj7j2I3JNX3X')
    }else if (command === 'np'){
        nowPlaying(message)
    }else if (command === 'communism'){
        runCommand(message, 'play https://www.youtube.com/playlist?list=PLEC9z34CbIByfimg9B_9Ti8K4NXrBRH0X')
    }else if (command.startsWith('remove')){
        var index = parseInt(command.replace('remove ', ''))
        removeSong(message, index)
    }
}

function shuffleArray(arr: any[]): any[] {
    for (let i = arr.length - 1; i > 1; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
function leave(){
    queue = []
    skipSong()
}  

function pauseSong() {
    player.pause();
}

function nowPlaying(message: any){
     const reply = `Now playing ${queue[0].title}`
     message.reply({
        content: reply
     })
}

function resumeSong() {
    player.unpause();
}

function skipSong() {
    player.stop();
}

function goTo(index: number){
    queue = queue.splice(index)
    skipSong()
}

function removeSong(message: any, index: number){
    queue = queue.splice(index-1, 1)
    message.reply({
        content: `Removed the song at ${index}`
    })
}



client.on('messageCreate', (message) =>{
    //console.log(message.content)!
    if (!message.content.startsWith(`!m play`)){
        message.content = message.content.toLowerCase()
    }

    if (message.author === client.user || message.content.startsWith('.')) {
        //Do nothing
        return
    }
    if(message.content.startsWith('!m')){
        runCommand(message, message.content.replace("!m ", ""))
    }
})



client.on('ready', () =>{
    console.log('The bot is ready')
})

