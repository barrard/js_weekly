const fs = require("fs-extra");

module.exports = {
    write_file,
    read_file_text,
};

// open file
async function write_file(filename, data, append) {
    try {
        const flag = append ? "a" : "w";
        /* check path exists */
        // pathExists
        const path = get_path(filename);

        await make_path_exist(path);

        const fd = await fs.open(filename, flag);
        fs.write(fd, data);
        return true;
    } catch (err) {
        if (err) throw err;
    }
}

function get_path(filename) {
    const path = filename.split("/");
    path.pop();
    return path.join("/");
}

async function make_path_exist(path) {
    // log("checking if path exists");
    try {
        /* assuming full filename and path */

        const exists = await fs.pathExists(path);
        // log({exists, path})
        if (!exists) await make_dir(path);

        return exists;
    } catch (err) {
        console.log("err".bgRed);
        console.log(err);
        return false;
    }
}

async function make_dir(path) {
    console.log(`making dir with ${path}`);
    try {
        console.log({ path });
        await fs.mkdirp(path);
        return true;
    } catch (err) {
        console.log("err".bgRed);
        console.log(err);
        return false;
    }
}

async function read_file_text(filename) {
    try {
        let file = await fs.readFile(filename, "utf8");
        return file;
    } catch (err) {
        console.log(err);
        return;
    }
}
