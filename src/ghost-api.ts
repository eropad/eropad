import axios from 'axios';

class GhostApi {
	#bio = 'Anne, 23, is captivating the world of erotic fiction with her imaginative, steamy tales. She\'s quickly becoming a must-read with each story she weaves, taking you on a sensual journey like no other...';
	#name = 'Anne Haenel';
	#blogTitle = 'Love, Lust & Passion';
	#email = 'anne.haenel.llp@gmail.com';
	#location = 'Paris';
	#coverImage = 'https://i.imgur.com/qgjYneP.png';
	#profileImage = 'https://i.imgur.com/g8pbLVS.png';
	#twitter = 'anne_haenel';
	#facebook = 'anne_haenel';

	#paths = {
		authSetup: '/authentication/setup',
		session: '/session',
		adminUser: '/users/1',
		htmlPublish: '/posts?source=html',
		imageUpload: '/images/upload',
	};

	#password;
	#axios;
	#website;

	constructor(options: {domain: string; password: string}) {
		this.#password = options.password;
		this.#website = `https://stories.${options.domain}`;

		this.#axios = axios.create({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			baseURL: `${this.#website}/ghost/api/admin`,
		});
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

		const cookie = headers['set-cookie'];

		if (!cookie) {
			throw new Error('Error while logging in');
		}

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
	}

	async publish(title: string, html: string, imgData: string) {
		const image = await this.#upload(imgData);

		await this.#axios.post(this.#paths.htmlPublish, {
			posts: [
				{
					title,
					html,
					status: 'published',
					// eslint-disable-next-line @typescript-eslint/naming-convention
					feature_image: image,
				},
			],
		});
	}
}

export default GhostApi;
