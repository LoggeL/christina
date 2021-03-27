import { AkairoClient, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { Intents } from 'discord.js';
import { join } from 'path';
import { CustomCommandHandler } from '../commands/CommandHandler';
import { CustomCommand } from '../commands/CustomCommand';
import { InteractionClient } from '../../../slash-commands/src/Client/Client';
import { Logger } from '../logger/Logger';
import { Database } from '../../../database/src/Database';
const defaultPrefix = process.env.DISCORD_COMMAND_PREFIX || '$';
export class DiscordBot extends AkairoClient {

    public readonly commandHandler: CustomCommandHandler<CustomCommand>;
    public readonly listenerHandler: ListenerHandler;
    public readonly inhibitorHandler: InhibitorHandler;
    public readonly interaction: InteractionClient;
    public readonly logger: Logger;
    public readonly db: Database;
    /**
     *
     */
    constructor(root: string) {

        super({
            ownerID: process.env.OWNER_ID?.split('--'),
            intents: Intents.ALL
        });
        this.commandHandler = new CustomCommandHandler(this, {
            directory: join(root, 'commands'),
            handleEdits: true,
            commandUtil: true,
            prefix: defaultPrefix
        });

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: join(root, 'inhibitors')
        });

        this.listenerHandler = new ListenerHandler(this, {
            directory: join(root, 'events')
        });

        this.interaction = new InteractionClient(this);


        this.logger = new Logger();
        this.db = new Database({
            appname: process.env.DATABASE_APP_NAME || 'ciri discord bot',
            dbname: process.env.DATABASE_NAME || 'discord_bot',
            host: 'localhost',
            port: 27017,
            auth: process.env.DATABASE_AUTH ?
                (() => {
                    const [user, pass] = process.env.DATABASE_AUTH.split('ßßß');
                    return {
                        user,
                        password: pass
                    };
                })() : undefined
        });

    }

    async start(): Promise<void> {
        try {
            this._prepare();
            await this.db.connect();
            await this.login();
        } catch (error) {
            this.logger.error(error);

        }
    }

    private _prepare(): void {

        this.commandHandler
            .useInhibitorHandler(this.inhibitorHandler)
            .useListenerHandler(this.listenerHandler)
            .loadAll();
        this.listenerHandler.setEmitters({
            client: this,
            commandHandler: this.commandHandler,
            ws: this.ws
        });
        this.listenerHandler.loadAll();
        // this.inhibitorHandler.loadAll();
    }
}
