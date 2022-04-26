const rp = require("request-promise");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { write_file, read_file_text } = require("./files");
const URL = "https://javascriptweekly.com";
const RawDataController = require("./controllers/RawDataController");
require("./db.js");
const port = 3333;

const express = require("express");
var cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    res.json({ hello: "hello world" });
});
app.get("/raw", async (req, res) => {
    //controller to get raw data
    let raw = await RawDataController.get();
    console.log(raw);
    res.json(raw);
});

app.get("/raw/addIgnore", async (req, res) => {
    const word = req.query.word;
    //controller to get raw data
    let resp = await RawDataController.ignore(word);
    // console.log(resp);
    res.json(resp);
});

app.get("/raw/getIgnore", async (req, res) => {
    let resp = await RawDataController.getIgnore();
    res.json(resp);
});

app.get("/raw/search", async (req, res) => {
    const search = req.query.search;
    let resp = await RawDataController.search(search);
    res.json(resp);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

main();

async function main() {
    // await getAllIssues();
    /**
     * Code to clean the raw data
     */
}

async function parseAllIssues(issuesHTML) {
    let $ = cheerio.load(issuesHTML);
    const allIssues = {};

    let issues = $(".issue");

    //TEMP
    // issues = Array.from(issues).slice(200);

    const done = await Promise.all(
        Array.from(issues).map(async (issue, issueI) => {
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    const ISSUE = $(issue).text();

                    console.log({ ISSUE });
                    //limits the issues for testing
                    // if (issueI < 100) {
                    //     return;
                    // }
                    issue = $(issue);

                    const issueHREF = $($(issue).children()[0]).attr("href");

                    let issueHTML = await getHTML(`${URL}/${issueHREF}`, `./${issueHREF}.html`);

                    let parsedIssue = await parseIssueTables(issueHTML, issueHREF);
                    // console.log(parsedIssue);
                    const noDupWTF = {};
                    parsedIssue.map((article) => {
                        article.text = article.text.trim("\n");
                        article.title = article.text.split("—")?.[0];
                        // console.log(article);
                        if (!noDupWTF[article.title]) {
                            noDupWTF[article.title] = article;
                        }
                    });

                    await Promise.all(
                        Object.keys(noDupWTF).map(async (key) => {
                            //SAVE TO DB?
                            // console.log(key);
                            await RawDataController.saveRawData(noDupWTF[key], ISSUE);
                        })
                    );

                    console.log("DATA SAVED");

                    return resolve(parsedIssue);
                }, issueI * 1000 * 2);
            });
        })
    );

    console.log(done);
}

async function parseIssueTables(issueHTML, issueHREF) {
    let incJobs;
    let isSponsor;
    let foundElMasthead = false;
    let issueName, IssueDate;
    let gotInBriefList = false;

    let $ = cheerio.load(issueHTML);
    const newsLetterData = [];

    console.log(issueHREF);
    const tables = $("table");
    const items = $("table.el-item");

    Array.from(tables).forEach((table, tableI) => {
        if (tableI < 200) {
            return;
        }
        console.log(tableI);
        const $ = cheerio.load(table);

        if (tableI === 0) {
            console.log("THE FIRST TABLE IS THE WHOLE THING");
            console.log($(table).text().length);
            let tables = $("table");
            console.log($(tables).children().length);
            return;
        }

        let tableText = $(table).text();

        if (tableI === 1) {
            tableText = tableText.trim();
            //This is the date and issue number
            let issueMeta = tableText.split("\n")[0];
            let [_issueName, _issueDate] = issueMeta.split("—");

            if (!_issueDate) {
                console.log(_issueDate);
            }
            issueName = _issueName.trim();
            issueDate = _issueDate.trim();

            console.log({ issueName, issueDate });
            try {
                console.log(new Date(issueDate));
            } catch (err) {
                console.log({ err, tableI });
                return;
            }
        }

        const ul = $("ul");
        const lis = $("li", ul);

        const p = $("p");

        if (p) {
            const pText = $(p).text();
            incJobs = pText.includes("Jobs");
            isSponsor = pText.includes("sponsor");
        }
        if (lis.length) {
            // console.log(ul);
            if (gotInBriefList) {
                console.log("shit going down");
            }

            Array.from(lis).forEach((li) => {
                gotInBriefList = true;
                const type = "IN BRIEF";
                const aText = $("a", li).text();
                const href = $("a", li).attr("href");
                const text = $(li).text();
                newsLetterData.push({ type, aText, href, text });
            });
        }
        if (incJobs && !tables.length) {
            throw new Error("NOOO");
        }
        if (incJobs && tables.length) {
            const tables = $("table", table);
            Array.from(tables).forEach((table) => {
                const text = $(table).text();
                const hrefs = $("a", table);
                const isJobsHeader = text.includes("Jobs");
                if (isJobsHeader) {
                    return;
                } else {
                    const [span1, span2] = Array.from($("span", table));
                    // console.log({ span1, span2 });
                    // console.log($(span1).text());
                    // console.log($(span2).text());
                    // console.log($(span2).text());

                    //some job?
                    newsLetterData.push({
                        text,
                        title: `${span1} - ${span2}`,
                        type: "Job",
                    });
                    return;
                }
            });
            return;
        }

        return;
    });

    // console.log(items);

    Array.from(items).forEach((table, tableI) => {
        let text = $(table).text();
        const hrefs = $("a", table);

        const articleHREFs = [];

        // try {
        Array.from(hrefs).forEach((href, i) => {
            // if (i % 2) return;
            const articleLink = $(href).attr("href");
            let text = $(href).text();

            // console.log({ articleLink, i });
            // let hasGot = text ? true : false;
            // if (hasGot) {
            // console.log(articleLink);
            // console.log(text);
            articleHREFs.push({
                articleLink,
                text,
                // type: incJobs ? "Job" : isSponsor ? "sponsor" : "article",
            });
            // }
        });

        newsLetterData.push({
            articleHREFs,
            text,
            type: "article",
        });
    });
    //DO SOMETHING??
    console.log(newsLetterData);
    return newsLetterData;
}
async function getHTML(url, fileName) {
    let issuesHTML;
    if (fileName) {
        //read file
        issuesHTML = await read_file_text(fileName);
    }
    if (!issuesHTML) {
        issuesHTML = await rp(url);
        if (fileName) {
            await write_file(fileName, issuesHTML);
        }
    }

    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(URL);
    // let issuesHTML = await page.content();

    return issuesHTML;
}

/**
 * Code to get all issues and store raw data in db.
 */
async function getAllIssues() {
    const issuesFileName = "./issuesHTML.html";
    const issuesURL = `${URL}/issues`;
    /*
     *		 REQUEST  - AND -  WRITE FILE
     */
    // const issuesHTML = await rp(URL);
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(URL);
    // let issuesHTML = await page.content();
    // await write_file(issuesFileName, issuesHTML);

    /*
     *   			READ  FILE
     */
    const issuesHTML = await read_file_text(issuesFileName);

    // console.log(issuesHTML);
    let done = await parseAllIssues(issuesHTML);
    console.log(done);
    console.log(done);
}

/*

	let ul = $("ul");

        const tableClass = $(table).attr("class");
        console.log($(table).attr("class"));

        if (tableClass === "el-masthead") {
            console.log("found el-masthead");
            foundElMasthead = true;
            return;
        }
        if (!foundElMasthead) {
            return;
        }

        console.log(tableText);
        console.log($(tables));
        console.log({ tableI });

        if (tableI < 4) {
            console.log("No NEEEEEEED");
        }

        console.log($(ul));
*/
