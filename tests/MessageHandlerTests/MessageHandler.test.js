const MessageHandler = require('../../src/utils/MessageHandler');
const GuildConfigRepository = require('../../src/repositories/GuildConfigRepository');
const { Message, Client } = require('discord.js');

jest.mock('../../src/repositories/GuildConfigRepository');
GuildConfigRepository.mockImplementation(() => ({
  getPrefix: jest.fn().mockReturnValue('+'),
  setPrefix: jest.fn().mockImplementation((prefix) => ({ prefix })),
}));

jest.mock('discord.js');
Message.mockImplementation(() => ({
  reply: jest.fn(),
  author: {},
}));

Client.mockImplementation(() => ({
  user: { id: 123 },
}));

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
    message = new Message();
    client = new Client();

    messageHandler = new MessageHandler(guildConfigRepo, client);
    messageHandler.prefixCommand = jest.fn();
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

  it('should call prefixCommand if message is only a mention', async () => {
    message.content = `<@${client.user.id}>`; // no space/!
    await messageHandler.handle(message);

    expect(messageHandler.prefixCommand).toHaveBeenCalledWith(
      message,
      undefined,
      '+'
    );

    message.reply.mockClear();

    message.content = `<@!${client.user.id}>`; // with !
    await messageHandler.handle(message);
    expect(messageHandler.prefixCommand).toHaveBeenCalledWith(
      message,
      undefined,
      '+'
    );

    message.reply.mockClear();

    message.content = `<@${client.user.id}> `; // with a space
    await messageHandler.handle(message);
    expect(messageHandler.prefixCommand).toHaveBeenCalledWith(
      message,
      undefined,
      '+'
    );
  });

  it('should not reply with the prefix is message is only the prefix', async () => {
    message.content = '+';
    await messageHandler.handle(message);

    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });

  it('should call prefixCommand for "prefix" command', async () => {
    message.content = '+prefix !';
    messageHandler.prefixCommand = jest.fn();
    await messageHandler.handle(message);

    expect(messageHandler.prefixCommand).toHaveBeenCalled();
    expect(messageHandler.prefixCommand).toHaveBeenCalledWith(
      message,
      '!',
      '+'
    );
  });
});

describe('prefixCommand', () => {
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
    message = new Message();
    client = new Client();

    messageHandler = new MessageHandler(guildConfigRepo, client);
  });

  it('should reply with the prefix if args is undefined', async () => {
    await messageHandler.prefixCommand(message, undefined, '+');
    expect(message.reply).toHaveBeenCalledWith(
      'The prefix for this server is `+`.'
    );
  });

  it('should complain if called with unsupported prefx', async () => {
    await messageHandler.prefixCommand(message, 'asdf!asdf', '+');
    expect(message.reply).toHaveBeenCalledWith(
      'Usage: `+prefix [-!"£$%^&*_=+]`'
    );
  });

  it('should save the prefix if it is supported', async () => {
    const testCases = [
      '-',
      '!',
      '!!!', // multiple
      '! ', // space after
      ' !', // space before
      '"',
      '£',
      '$',
      '%',
      '^',
      '&',
      '*',
      '_',
      '=',
      '+',
    ];

    for (const testCase of testCases) {
      const res = await messageHandler.prefixCommand(message, testCase, '+');
      
      expect(guildConfigRepo.setPrefix).toHaveBeenCalledWith(testCase.trim());
      expect(message.reply).toHaveBeenCalledWith(`Set the prefix to \`${testCase.trim()}\`.`);

      guildConfigRepo.setPrefix.mockClear();
    }
  });
});
