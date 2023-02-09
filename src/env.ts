import process from 'node:process';

export const {
	OPENAI_SECRET: openAiSecret = '',
	BASE_DOMAIN: domain = '',
	GHOST_PASSWORD: password = '',
} = process.env;
