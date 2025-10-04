(function(Scratch) {
    'use strict';
    let provider = 'cerebras.ai'
    let messages = [];
    let API_KEY = null;
    let AIargs = {
        "model": "qwen-3-235b-a22b-instruct-2507",
        "max_completion_tokens": 2000,
        "temperature": 0.7,
        "top_p": 0.8
    };

    class AIutils {
        getInfo() {
            return {
                id: 'aiutils',
                name: 'Inference API',
                color1: '#00A4A6',
                color2: '#015052ff',
                color3: '#015052ff',
                blocks: [
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Basic Utils'
                    },
//get all roles/contents of messages
                    {
                        opcode: 'messagesInfo',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[TYPE] of all messages',
                        disableMonitor: true,
                        arguments: {
                            TYPE: { type: Scratch.ArgumentType.STRING, menu: 'TYPES' }
                        }
                    },
//obvious
                    {
                        opcode: 'deleteall',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Clear all messages (danger)'
                    },
//sends a new message as the user
                    {
                        opcode: 'newMessage_user',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'User message [MESSAGE]',
                        arguments: {
                            MESSAGE: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
                        }
                    },
//sets the system message(i.e 'you are a helpful assistant')
                    {
                        opcode: 'systemMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set system message to [CONTENT]',
                        arguments: {
                            CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
                        }
                    },
//sends a message to the AI and adds the response to messages
                    {
                        opcode: 'messageAI',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'send messages to AI and record response',
                    },
                    "---",
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Configure AI'
                    },
//input API key for confirmation
                    {
                        opcode: 'setAPIkey',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set API key to [APIKEYVALUE]',
                        arguments: {
                            APIKEYVALUE: { type: Scratch.ArgumentType.STRING }
                        }
                    },
//max_completion_tokens, temperature etc.
                    {
                        opcode: 'setConfig',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set AI [CONFIG] to [VALUE]',
                        arguments: {
                            CONFIG: { type: Scratch.ArgumentType.STRING, menu: 'CONFIGS' },
                            VALUE: { type: Scratch.ArgumentType.STRING }
                        }
                    },
//same as above, but instead of setting it, returns value
                    {
                        opcode: 'getConfig',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'AI [CONFIG] value',
                        disableMonitor: true,
                        arguments: {
                            CONFIG: { type: Scratch.ArgumentType.STRING, menu: 'CONFIGS' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Advanced Utils'
                    },
//adds a message as a certain role
                    {
                        opcode: 'newMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Add message from role:[ROLE] with content:[MESSAGE]',
                        arguments: {
                            ROLE: { type: Scratch.ArgumentType.STRING, menu: 'ROLES' },
                            MESSAGE: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
                        }
                    },
//sets provider to various AI inference provider(currently only cerebras)
                    {
                        opcode: 'setProvider',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'set inference provider to [PROVIDER]',
                        disableMonitor: true,
                        arguments: {
                            PROVIDER: { type: Scratch.ArgumentType.STRING, menu: 'PROVIDERS' }
                        }
                    },
//sends messages and returns response instead of logging it
                    {
                        opcode: 'sendMessages',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'AI response to messages',
                        disableMonitor: true
                    },
                ],
                menus: {
                    ROLES: { acceptReporters: false, items: ['system', 'user', 'assistant'] },
                    TYPES: { acceptReporters: false, items: ['role', 'content'] },
                    CONFIGS: { acceptReporters: false, items: ['model', 'max_completion_tokens', 'temperature', 'top_p'] },
                    PROVIDERS: { acceptReporters: false, items: ['cerebras.ai']}
                }
            };
        }
        //send a message to the AI
        sendMessages() {
            const url = `https://api.${provider}/v1/chat/completions`;

            return fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: AIargs["model"],
                    messages: messages,
                    max_completion_tokens: AIargs["max_completion_tokens"],
                    temperature: AIargs["temperature"],
                    top_p: AIargs["top_p"],
                    stream: false
                })
            })
                .then((response) => response.json())
                .then((data) => {
                    return data.choices?.[0]?.message?.content || "";
                })
                .catch((error) => {
                    console.error(error);
                    return "Uh oh! Something went wrong.";
                });
        }
        async messageAI() {
            const reply = await this.sendMessages();
            messages.push({ role: 'assistant', content: reply });
        }
        // Add a new message to the list as any role(dont use)
        newMessage(args) {
            messages.push({ role: args.ROLE, content: args.MESSAGE });
        }
        //add a new message as the user(use this one)
        newMessage_user(args) {
            messages.push({ role: 'user', content: args.MESSAGE });
        }

        systemMessage(args) {
            if (messages.length > 0 && messages[0].role === 'system') {
                // Update content of the first system message
                messages[0].content = args.CONTENT;
            } else {
                // Add new system message to the front
                messages.unshift({ role: 'system', content: args.CONTENT });
            }
        }

        deleteall() {
            messages = [];
        }

        // Return a simple message object (debug)
        messageItem(args) {
            return { role: args.ROLE, content: args.MESSAGE };
        }

        // Return array of all values of a given type from all messages
        messagesInfo(args) {
            const messageType = args.TYPE; // 'role' or 'content'
            const messageItems = messages.map(obj => obj[messageType]);
            return JSON.stringify(messageItems);
        }

        setConfig(args) {
            AIargs[args.CONFIG] = args.VALUE;
        }

        getConfig(args) {
            return AIargs[args.CONFIG];
        }

        setAPIkey(args) {
            API_KEY = args.APIKEYVALUE;
        }
        setProvider(args) {
            provider = args.PROVIDER
        }


    }

    Scratch.extensions.register(new AIutils());

})(Scratch);
