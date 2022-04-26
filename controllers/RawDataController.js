const RawDataModel = require("../models/RawDataModel");
const IgnoreWord = require("../models/IgnoreWord");

module.exports = {
    saveRawData,
    get,
    ignore,
    getIgnore,
    search,
};

let allRaw;
async function search(word) {
    //split word?
    const words = word.trim().split(" ");
    console.log(words);
    // const ignoreList = await IgnoreWord.find({}, {}, { lean: true });
    if (!allRaw) {
        allRaw = await RawDataModel.find({}, {}, { lean: true });
    }

    let finds = {};
    console.time("search");
    allRaw.forEach((article) => {
        let count = 0;
        words.forEach((word) => {
            const titleWords = article.title.split(" ");
            const articleWords = article.text.split(" ");
            const allWords = [...titleWords, ...articleWords];
            allWords.forEach((articleWord) => {
                if (articleWord.toLowerCase() === word.toLowerCase()) {
                    count = count + 1;
                }
            });
        });

        if (count) {
            finds[article._id] = { ...article, count };
        }
    });

    finds = Object.values(finds).sort((a, b) => b.count - a.count);

    const MAX_RESULTS = 100;

    finds = finds.slice(0, MAX_RESULTS);
    console.timeEnd("search");

    console.log(`Found ${finds.length}`);
    console.log(finds);
    return finds;
}

async function getIgnore() {
    const ignore = await IgnoreWord.find({}, {}, { lean: true });

    return ignore;
}

async function ignore(word) {
    console.log(word);
    let resp = await IgnoreWord.findOneAndUpdate(
        {
            word,
        },
        {},
        { upsert: true, lean: true, new: true }
    );

    return resp;
}

async function get() {
    let raw = await RawDataModel.find({}, {}, { lean: true }).limit(100);
    return raw;
}
async function saveRawData(rawData, ISSUE) {
    // console.log(rawData);
    const { type, title, href, text, articleHREFs } = rawData;

    try {
        return await RawDataModel.findOneAndUpdate(
            {
                ISSUE,
                title,
            },
            { type, title, href, text, ISSUE, articleHREFs },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
}
