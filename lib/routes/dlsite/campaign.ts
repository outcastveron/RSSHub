import InvalidParameterError from '@/errors/types/invalid-parameter';
import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';

const host = 'https://www.dlsite.com';
const infos = {
    // 全年齢向け
    home: {
        type: 'home',
        name: '「DLsite 同人」',
        url: '/home/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['doujin'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    comic: {
        type: 'comic',
        name: '「DLsite コミック」',
        url: '/comic/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['books'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    soft: {
        type: 'soft',
        name: '「DLsite PCソフト」',
        url: '/soft/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['pc'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    // 成人向け( R18 )
    maniax: {
        type: 'maniax',
        name: '「DLsite 同人 - R18」',
        url: '/maniax/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['doujin'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    books: {
        type: 'books',
        name: '「DLsite 成年コミック - R18」',
        url: '/books/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['books'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    pro: {
        type: 'pro',
        name: '「DLsite 美少女ゲーム」',
        url: '/pro/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['pc'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    // 女性向け
    girls: {
        type: 'girls',
        name: '「DLsite 乙女」',
        url: '/girls/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['doujin'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
    bl: {
        type: 'bl',
        name: '「DLsite BL」',
        url: '/bl/fsr',
        params: {
            campaign: 'campaign',
            work_category: ['doujin'],
            order: ['cstart_d'],
            per_page: 30,
            show_type: 1,
        },
    },
};
const setUrl = (info) => {
    let paramsPath = `${info.url}/=/`;
    const params = info.params;
    for (const name in params) {
        if (Array.isArray(params[name])) {
            for (const index in params[name]) {
                paramsPath += `${name}[${index}]/${params[name][index]}/`;
            }
        } else {
            paramsPath += `${name}/${params[name]}/`;
        }
    }
    return paramsPath.slice(1);
};

export const route: Route = {
    path: '/campaign/:type/:free?',
    categories: ['anime'],
    example: '/dlsite/campaign/home',
    parameters: {
        type: {
            description: '类型',
            options: Object.values(infos).map((info) => ({ value: info.type, label: info.name })),
        },
        free: {
            description: '免费',
            options: [{ value: '1', label: '是' }],
        },
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Discounted Works',
    maintainers: ['cssxsh'],
    handler,
};

async function handler(ctx) {
    const info = infos[ctx.req.param('type')];
    // 判断参数是否合理
    if (info === undefined) {
        throw new InvalidParameterError('不支持指定类型！');
    }
    if (ctx.req.param('free') !== undefined) {
        info.params.is_free = 1;
    }
    const link = setUrl(info);

    const response = await got(new URL(link, host), {
        method: 'GET',
    });
    const data = response.data;
    const $ = load(data);

    const title = `${info.name} | 割引中の作品`;
    const description = $('meta[name="description"]').attr('content');
    const list = $('tr[class]', '.n_worklist');
    const item = list.toArray().map((element) => {
        const title = $('.work_name', element).text();
        const link = $('.work_name > a', element).attr('href');
        // 使链接
        $('a', element).each((_index, element) => {
            $(element).attr('target', '_blank');
        });
        const description = $(element).html();
        const arr = $('.search_tag', element);
        const category = $('a', arr)
            .toArray()
            .map((a) => $(a).text());
        const author = $('.maker_name', element).text();

        const signle = {
            title,
            link,
            description,
            category,
            author,
        };
        return signle;
    });

    return {
        title,
        link: `${host}/${link}`,
        description,
        language: 'ja-jp',
        allowEmpty: true,
        item,
    };
}
