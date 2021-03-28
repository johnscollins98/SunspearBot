const MessageHandler = require('../../src/utils/MessageHandler');
const GuildConfigRepository = require('../../src/repositories/GuildConfigRepository');
const { Message, Client, GuildMember } = require('discord.js');

jest.mock('../../src/repositories/GuildConfigRepository');
GuildConfigRepository.mockImplementation(() => ({
  getPrefix: jest.fn().mockResolvedValue('+'),
  setPrefix: jest.fn().mockImplementation(
    (prefix) =>
      new Promise((resolve) => {
        resolve({ prefix });
      })
  ),
  getAdminRole: jest.fn().mockResolvedValue('12345'),
  setAdminRole: jest.fn().mockImplementation(
    (adminRole) =>
      new Promise((resolve) => {
        resolve({ adminRole });
      })
  ),
}));

jest.mock('discord.js');
Message.mockImplementation(() => ({
  reply: jest.fn(),
  author: {},
  guild: {
    roles: {
      resolve: jest.fn().mockImplementation((id) => id),
    },
    member: jest.fn().mockImplementation(() => ({
      hasPermission: jest.fn().mockReturnValue(true),
      roles: {
        cache: {
          get: jest.fn().mockImplementation((id) => id),
        },
      },
    })),
  },
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
    guildConfigRepo.getPrefix.mockResolvedValueOnce(null);
    await messageHandler.handle(message);
    expect(message.reply).toHaveBeenCalledWith('Could not find this command.');
  });

  it('should not reply if no prefix is defined and default is not used', async () => {
    message.content = '!test';
    guildConfigRepo.getPrefix.mockResolvedValueOnce(null);
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

  it('should call adminCommand for "adminRole" command', async () => {
    message.content = '+adminRole 12345';
    messageHandler.adminCommand = jest.fn();
    await messageHandler.handle(message);

    expect(messageHandler.adminCommand).toHaveBeenCalled();
    expect(messageHandler.adminCommand).toHaveBeenCalledWith(message, '12345');
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
    messageHandler.authorHasAdminRole = jest.fn().mockResolvedValue(true);
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
      expect(message.reply).toHaveBeenCalledWith(
        `Set the prefix to \`${testCase.trim()}\`.`
      );

      guildConfigRepo.setPrefix.mockClear();
    }
  });

  it('should not allow setting prefix without adminRole', async () => {
    messageHandler.authorHasAdminRole = jest.fn().mockReturnValueOnce(false);
    const res = await messageHandler.prefixCommand(message, '!', '+');

    expect(message.reply).toHaveBeenCalledWith(
      'You do not have permissions to set the prefix.'
    );
    expect(guildConfigRepo.setPrefix).not.toHaveBeenCalled();
  });
});

describe('adminCommand', () => {
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

  it('should reply with the current admin if no roleId is passed and an admin exists', async () => {
    await messageHandler.adminCommand(message, undefined);
    expect(message.reply).toHaveBeenCalledWith('Current Admin is 12345');
  });

  it('should say no admin exists if no roleId is passed and no admin exists', async () => {
    guildConfigRepo.getAdminRole.mockResolvedValueOnce(null);
    await messageHandler.adminCommand(message, undefined);
    expect(message.reply).toHaveBeenCalledWith('No admin role set.');
  });

  it('should allow getting admin role without Administrator permissions', async () => {
    message.guild.member.mockImplementation(() => ({
      hasPermission: jest.fn().mockReturnValue(false),
    }));

    await messageHandler.adminCommand(message, undefined);
    expect(message.reply).toHaveBeenCalledWith('Current Admin is 12345');
  });

  it('should not allow setting admin role without Administrator permissions', async () => {
    message.guild.member.mockImplementation(() => ({
      hasPermission: jest.fn().mockReturnValue(false),
    }));

    await messageHandler.adminCommand(message, '123');
    expect(message.reply).toHaveBeenCalledWith(
      'You do not have permissions to set the Admin Role'
    );
  });

  it('should complain if stored roleId cannot found on discord server', async () => {
    message.guild.roles.resolve.mockReturnValueOnce(null);

    await messageHandler.adminCommand(message, undefined);
    expect(message.reply).toHaveBeenCalledWith(
      'Stored admin role is invalid (not found)'
    );
  });

  it('should complain if given roleId cannot be found on server', async () => {
    message.guild.roles.resolve.mockReturnValueOnce(null);

    await messageHandler.adminCommand(message, '5432');
    expect(message.reply).toHaveBeenCalledWith(
      'Cannot find the given role on this server.'
    );
  });

  it('should save the roleId if valid and found', async () => {
    await messageHandler.adminCommand(message, '654');
    expect(message.reply).toHaveBeenCalledWith('Set Admin Role to 654');
    expect(guildConfigRepo.setAdminRole).toHaveBeenCalledWith('654');
  });
});

describe('authorHasAdminRole', () => {
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

  it('should return true if admin role is null', async () => {
    guildConfigRepo.getAdminRole.mockResolvedValueOnce(null);
    const res = await messageHandler.authorHasAdminRole(message);
    expect(res).toBeTruthy();
  });

  it('should return false and warn if admin role is invalid', async () => {
    message.guild.roles.resolve.mockReturnValueOnce(null);
    message.guild.member.mockImplementation(() => ({
      roles: {
        cache: {
          get: jest.fn().mockReturnValueOnce(null),
        },
      },
    }));
    const res = await messageHandler.authorHasAdminRole(message);
    expect(message.reply).toHaveBeenCalledWith(
      'Warning: Stored admin role cannot be found.'
    );
    expect(res).toBeFalsy();
  });

  it('should return false if the user does not have the role set as the admin role', async () => {
    message.guild.member.mockImplementation(() => ({
      roles: {
        cache: {
          get: jest.fn().mockReturnValueOnce(null),
        },
      },
    }));

    const res = await messageHandler.authorHasAdminRole(message);
    expect(res).toBeFalsy();
  });
});
