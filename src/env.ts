import process from 'node:process';

export const {
	OPENAI_SECRET: openAiSecret = '',
	BASE_DOMAIN: domain = '',
	GHOST_PASSWORD: password = '',
	MAILGUN_API_KEY: mailgunApiKey = '',
	MAILGUN_DOMAIN: mailgunDomain = '',
	MAILGUN_BASE_URL: mailgunBaseUrl = '',
	CODE_INJECTION_HEAD: codeInjectionHead = '',

} = process.env;
