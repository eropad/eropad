import crypto from 'node:crypto';
import axios from 'axios';
import categories from './categories.js';

const straightCategory = 'Straight';

class GhostApi {
	#bio = 'Anne, 23, is captivating the world of erotic fiction with her imaginative, steamy tales. She\'s quickly becoming a must-read with each story she weaves, taking you on a sensual journey like no other.';
	#description = 'Discover the hottest stories ranging from steamy romance to hardcore action. Love, Lust & Passion has something for every one of your fantasies.';
	#name = 'Anne Haenel';
	#blogTitle = 'Love, Lust & Passion';
	#email = 'anne.haenel.llp@gmail.com';
	#location = 'Paris';
	#coverImage = 'https://i.imgur.com/qgjYneP.png';
	#profileImage = 'https://i.imgur.com/g8pbLVS.png';
	#twitter = 'anne_haenel';
	#facebook = 'anne_haenel';
	#icon = 'https://ghost.org/images/logos/ghost-logo-orb.png';

	#paths = {
		authSetup: '/authentication/setup',
		session: '/session',
		adminUser: '/users/1',
		publish: '/posts',
		imageUpload: '/images/upload',
		settings: '/settings',
		customThemeSettings: '/custom_theme_settings',
		newsletters: '/newsletters',
	};

	#password;
	#axios;
	#website;
	#codeInjectionHead;
	#mailgunApiKey;
	#mailgunBaseUrl;
	#mailgunDomain;

	constructor(options: {domain: string; password: string; codeInjectionHead: string; mailgunApiKey: string; mailgunBaseUrl: string; mailgunDomain: string}) {
		this.#password = options.password;
		this.#codeInjectionHead = options.codeInjectionHead;
		this.#mailgunApiKey = options.mailgunApiKey;
		this.#mailgunBaseUrl = options.mailgunBaseUrl;
		this.#mailgunDomain = options.mailgunDomain;
		this.#website = `https://stories.${options.domain}`;

		this.#axios = axios.create({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			baseURL: `${this.#website}/ghost/api/admin`,
		});
	}

	#textToHtml(text: string) {
		return `<html><head></head><body><p>${text.replace(/\n/g, '<br> ')}</p></body></html>`;
	}

	async #upload(b64: string) {
		const blob = await fetch(`data:image/png;base64,${b64}`).then(async result => result.blob());
		const form = new FormData();

		form.append('file', blob, `${crypto.randomUUID()}.png`);

		const response = await this.#axios.post<{
			'images': [
				{
					'url': string;
				},
			];
		}>(this.#paths.imageUpload, form);

		return response.data.images[0].url;
	}

	async init() {
		const {data: {setup}} = await this.#axios.get<{setup: [{status: boolean}]}>(this.#paths.authSetup);

		if (!setup[0].status) {
			await this.#axios.post(this.#paths.authSetup, {
				setup: [{
					name: this.#name,
					email: this.#email,
					password: this.#password,
					blogTitle: this.#blogTitle,
				}],
			});
		}

		const {headers} = await this.#axios.post(this.#paths.session, {
			username: this.#email,
			password: this.#password,
		});

		const cookie = headers['set-cookie']!;

		this.#axios.defaults.headers.Cookie = cookie;

		const {data: {users}} = await this.#axios.get<{users: [Record<string, string>]}>(this.#paths.adminUser);

		users[0].bio = this.#bio;
		users[0].location = this.#location;
		users[0].cover_image = this.#coverImage;
		users[0].profile_image = this.#profileImage;
		users[0].twitter = this.#twitter;
		users[0].facebook = this.#facebook;
		users[0].website = this.#website;
		users[0].meta_title = `${this.#name} - ${this.#blogTitle}`;
		users[0].meta_description = this.#bio;

		await this.#axios.put(this.#paths.adminUser, {
			users,
		});

		await this.#axios.put(this.#paths.settings, {
			settings: [
				{key: 'mailgun_api_key', value: this.#mailgunApiKey},
				{key: 'mailgun_domain', value: this.#mailgunDomain},
				{key: 'mailgun_base_url', value: this.#mailgunBaseUrl},
				{key: 'description', value: this.#description},
				{key: 'codeinjection_head', value: this.#codeInjectionHead},
				{key: 'icon', value: this.#icon},
				{key: 'comments_enabled', value: 'all'},
			],
		});

		const {data: {custom_theme_settings: customThemeSettings}} = await this.#axios.get<{
			custom_theme_settings: Array<{key: string; value: string}>;
		}>(this.#paths.customThemeSettings);

		const themeSetting = customThemeSettings.find(setting => setting.key === 'color_scheme')!;

		themeSetting.value = 'Auto';

		await this.#axios.put(this.#paths.customThemeSettings, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			custom_theme_settings: customThemeSettings,
		});

		const {data: {newsletters}} = await this.#axios.get<{
			newsletters: Array<Record<string, unknown>>;
		}>(this.#paths.newsletters);

		const defaultNewsletter = newsletters.find(nl => nl.slug === 'default-newsletter');

		if (defaultNewsletter) {
			defaultNewsletter.name = straightCategory;
			defaultNewsletter.slug = straightCategory;
		}

		const nlMap = Array.from(new Set(categories)).map(category => {
			const nl = newsletters.find(nl => nl.name === (category || straightCategory));

			return nl ?? {name: (category || straightCategory)};
		});

		if (defaultNewsletter) {
			nlMap.push(defaultNewsletter);
		}

		for (const nl of nlMap) {
			nl.feedback_enabled = true;
			nl.show_header_name = true;
			nl.sort_order = 0;
		}

		await Promise.all(nlMap.map(async nl => {
			if (nl.id) {
				return this.#axios.put(`${this.#paths.newsletters}/${nl.id as string}`, {
					newsletters: [nl],
				});
			}

			return this.#axios.post(this.#paths.newsletters, {
				newsletters: [nl],
			});
		}));
	}

	async publish(title: string, text: string, imgData: string, tags: [string, string]) {
		if (!tags[0]) {
			tags[0] = straightCategory;
		}

		const image = await this.#upload(imgData);
		const html = this.#textToHtml(text);

		const {data: {posts: {0: post}}} = await this.#axios.post<{posts: [Record<string, string>]}>(`${this.#paths.publish}?source=html`, {
			posts: [
				{
					title,
					html,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					feature_image: image,
					tags,
					featured: true,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					primary_tag: tags[0],
					// eslint-disable-next-line @typescript-eslint/naming-convention
					og_image: image,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					og_title: title,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					twitter_image: image,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					twitter_title: title,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					meta_title: title,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					email_subject: title,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					feature_image_alt: title,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					feature_image_caption: title,
				},
			],
		});

		post.og_description = post.excerpt;
		post.meta_description = post.excerpt;
		post.twitter_description = post.excerpt;
		post.status = 'published';

		await this.#axios.put(`${this.#paths.publish}/${post.id}?newsletter=${tags[0].toLowerCase()}`, {posts: [post]});
	}
}

export default GhostApi;
