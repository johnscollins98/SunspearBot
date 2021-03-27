const MessageHandler = require('../../src/utils/MessageHandler');
const GuildConfigRepository = require('../../src/repositories/GuildConfigRepository');
const { Message, Client } = require('discord.js');

jest.mock('../../src/repositories/GuildConfigRepository');
jest.mock('../../src/utils/DataProcessor');
jest.mock('discord.js');

describe('handleMessage', () => {
  /** @type {MessageHandler} */
  let messageHandler;

  /** @type {GuildConfigRepository} */
  let guildConfigRepo;

  /** @type {Message} */
  let message;

  /** @type {Client} */
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    guildConfigRepo = new GuildConfigRepository();
    guildConfigRepo.getPrefix.mockReturnValue('+');

    message = new Message();
    message.author = {};

    client = new Client();
    client.user = { id: 123 };

    messageHandler = new MessageHandler(guildConfigRepo, client);
  });

  it('should run without failing', async () => {
    message.content = 'anything';
    await messageHandler.handle(message);
  });

  it('should not reply if message does not start with prefix', async () => {
    message.content = '!test';
    await messageHandler.handle(message);
    expect(message.reply).not.toHaveBeenCalled();
  });

  it('should reply if the message starts with the prefix', async () => {
    message.content = '+test';
    await messageHandler.handle(message);
    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });

  it('should reply if no prefix is defined and default is used', async () => {
    message.content = '^test';
    guildConfigRepo.getPrefix.mockReturnValueOnce(null);
    await messageHandler.handle(message);
    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });

  it('should not reply if no prefix is defined and default is not used', async () => {
    message.content = '!test';
    guildConfigRepo.getPrefix.mockReturnValueOnce(null);
    await messageHandler.handle(message);
    expect(message.reply).not.toHaveBeenCalled();
  });

  it('should not reply if message is sent by a bot', async () => {
    message.content = '+test';
    await messageHandler.handle(message);
    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');

    message.reply.mockClear();

    message.author.bot = true;
    await messageHandler.handle(message);
    expect(message.reply).not.toHaveBeenCalled();
  });

  it('should reply if the message begins with <@{client.user.id}>', async () => {
    message.content = `<@${client.user.id}> testCommand`;
    await messageHandler.handle(message);

    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });

  it('should reply if the message begins with <@!{client.user.id}>', async () => {
    message.content = `<@!${client.user.id}> testCommand`;
    await messageHandler.handle(message);

    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });

  it('should reply with the prefix if message is only a mention', async () => {
    message.content = `<@${client.user.id}>`; // no space/!
    await messageHandler.handle(message);

    expect(message.reply).toHaveBeenCalledWith(
      'The prefix for this server is `+`.'
    );

    message.reply.mockClear();

    message.content = `<@!${client.user.id}>`; // with !
    await messageHandler.handle(message);
    expect(message.reply).toHaveBeenLastCalledWith(
      'The prefix for this server is `+`.'
    );

    message.reply.mockClear();

    message.content = `<@${client.user.id}> `; // with a space
    await messageHandler.handle(message);
    expect(message.reply).toHaveBeenLastCalledWith(
      'The prefix for this server is `+`.'
    );
  });

  it('should not reply with the prefix is message is only the prefix', async () => {
    message.content = '+';
    await messageHandler.handle(message);

    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });
});