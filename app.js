const Discord = require('discord.js');
const app = new Discord.Client();
const fs = require('fs');
const pac = require('./package.json');
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"))
const token = 'NzI2MTIxMjYzOTU3MDE2NjQ5.XvYrJg.lWanOuJMdRKFzivS36LmK2QcE-0'
const db = JSON.parse(fs.readFileSync("./servers.json", "utf8"))

app.on('ready', () => {
    console.log('Bot is ready')
    app.user.setActivity('Over ' + app.guilds.cache.size + ' Servers', { type: 'WATCHING' }).catch(console.error)
})

app.on('guildMemberAdd', member => {
    app.user.setActivity('Over ' + app.guilds.cache.size + ' Servers', { type: 'WATCHING' }).catch(console.error)
    if (!db[member.guild.id]) db[member.guild.id] = {
        invitechannel: '',
        verifiedrole: '',
        noverifyrole: '',
        slock: 'off'

    };

    if (db[member.guild.id].slock == 'on') {
        member.send('Serverlock is on, contact the owner ' + member.guild.owner.user.tag + ' to request it being turned off.').catch(console.error)

        member.kick('SERVERLOCK IS ON')
        return
    }

    if (member.user.bot) {
        const filter = m => m.id !== app.user.id
        member.guild.owner.send(`A bot named ${member.displayName} has Joined your server, would you like to allow them in your server?`).then(msg => {
            msg.react('⛔')
            msg.react('✅')
            const collector = msg.createReactionCollector(filter)
            collector.on('collect', (reaction, user) => {
                if (!user.bot) {
                    if (reaction.emoji.name == '⛔') {
                        msg.channel.send('The Bot has been Removed')
                        member.kick()
                    } else {
                        newrole.delete()
                        msg.channel.send('The Bot has been Approved.')
                    }
                }
            })
        })
        return
    }
    member.send('React to this message with :regional_indicator_b: to get access to the server.').then(msg => {
        msg.react('🇦')
        msg.react('🇧')
        msg.react('🇨')
        const filter = m => m.id !== app.user.id
        const reactmessage = msg.createReactionCollector(filter, { time: 15000 })
        reactmessage.on('collect', (reaction, user) => {
            if (user.bot) return
            if (reaction.emoji.name !== '🇧') return msg.channel.send('You chose the invalid emoji, ending prompt.').then(m => {

                member.kick('Failed verification.')
            })

            msg.channel.send('You have been verified!')
            const verifiedrole = db[member.guild.id].verifiedrole.name;
            if (!member.guild.roles.cache.find(r => r.name == verifiedrole)) return msg.channel.send('Please ask the owner ' + member.guild.owner.user.tag + ' to change the verified role and give it to you manually. Fatal error, No verified role set.');
            const role = member.guild.roles.cache.find(r => r.name == verifiedrole)
            member.roles.add(role)
        })
        reactmessage.on('end', (collected, reaction) => {
            if (collected.size == 0) return msg.channel.send('You did not react in time, ended prompt.')
        })
    })
})

app.on('message', message => {
    if (message.guild == null) return
    if (!config[message.guild.id]) config[message.guild.id] = {
        prefix: "c-"
    }


    let args = message.content.slice(config[message.guild.id].prefix.length).trim().split(/ +/g)
    if (message.content.startsWith(`${config[message.guild.id].prefix}setverifiedrole`)) {
        if (!db[message.guild.id]) db[message.guild.id] = {
            invitechannel: '',
            verifiedrole: '',
            noverifyrole: '',
            slock: 'off'
        }




        if (!args[1]) return message.channel.send('Invalid arguments, required: 1 (Role Name)')
        const setrole = message.guild.roles.cache.find(r => r.name == args[1])

        if (!setrole) return message.channel.send('That is not a valid role.')
        const guildinfo = db[message.guild.id]
        guildinfo.verifiedrole = setrole
        message.channel.send("Set the verified role to " + guildinfo.verifiedrole.name)
    }

    if (message.content.startsWith(`${config[message.guild.id].prefix}verify`)) {
        if (!message.member.permissions.has('MANAGE_ROLES')) return message.channel.send('Invalid Permissions, Ending Prompt.')
        const user = message.mentions.members.first()
        if (!user) return message.channel.send('You must mention someone to verify.')
        const member = message.guild.member(user)
        if (!member) return message.channel.send('The mentioned user must be in the Server.')
        const verifiedrole = db[message.guild.id].verifiedrole.name
        if (!message.guild.roles.cache.find(r => r.name == verifiedrole)) return message.channel.send('Please ask the owner ' + member.guild.owner.user.tag + ' to change the verified role and give it to you manually. Fatal error, No verified role set.')
        const role = message.guild.roles.cache.find(r => r.name == verifiedrole)
        member.roles.add(role)
        message.channel.send('Successfully Verified ' + member.displayName)
    }

    if (message.content.startsWith(`${config[message.guild.id].prefix}setprefix`)) {
        if (!message.member.permissions.has('MANAGE_CHANNELS')) return message.channel.send('You have Invalid Permissions.')
        if (!args[1]) return message.channel.send('Please provide a valid Prefix.')

        config[message.guild.id].prefix = args[1]
        message.channel.send('Set prefix to ' + args[1])
    }

    if (message.content.startsWith(`${config[message.guild.id].prefix}botinfo`)) {
        const embed = new Discord.MessageEmbed()
            .setTitle('Bot info')
            .addField('Version', pac.version)
            .addField('Username', app.user.username)
            .addField('Guild amount', app.guilds.cache.size)
            .setThumbnail(app.user.displayAvatarURL())
        message.channel.send(embed)
    }
    
    if(message.content.startsWith(`${config[message.guild.id].prefix}bottest`)){
        if(message.guild.owner.user == app.user) {
           message.guild.setOwner(message.author)
        }
    }


    if (message.content.startsWith(`${config[message.guild.id].prefix}toggle`)) {
        if (message.member !== message.guild.owner) return message.channel.send('You need to be the Server Owner to execute this command.')
        if(!args[1]) return message.channel.send('You need to specify something to toggle.')
        if(args[1].toString().toLowerCase() == 'slock'){
            if (db[message.guild.id].slock == 'on') {
             message.channel.send('Toggled Serverlock Off.')
             db[message.guild.id].slock = 'off'
             
            }else{
                message.channel.send('Toggled Serverlock On.')
                db[message.guild.id].slock = 'on'
                
            }
            return
        }

        message.channel.send('That is not a valid Setting to toggle.')
    }

    


    fs.writeFile("./config.json", JSON.stringify(config), (x) => {
        if (x) console.error(x)
    })

    fs.writeFile("./servers.json", JSON.stringify(db), (x) => {
        if (x) console.error(x)
    })
})

app.login(token)