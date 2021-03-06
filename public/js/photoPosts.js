var photoPosts = (function () {
    let database;

    const CONSTANTS = {
        EXPRESSIONS: {
            isString: (post, name) => post.hasOwnProperty(name) && typeof post[name] === 'string',
            id: (post) => CONSTANTS.EXPRESSIONS.isString(post, 'id') && post.id > database.length,
            description: (post) => CONSTANTS.EXPRESSIONS.isString(post, 'description') && post.description.length < 200,
            createdAt: (post) => CONSTANTS.EXPRESSIONS.isString(post, 'createdAt'),
            author: (post) => CONSTANTS.EXPRESSIONS.isString(post, 'author') && post.author.length > 0,
            photoLink: (post) => CONSTANTS.EXPRESSIONS.isString(post, 'photoLink') && post.photoLink.length > 0
        },
        EDITABLE_FIELD: ['description', 'photoLink']
    };

    function loadDatabase() {
        if (!database) {
            const fs = require('fs');
            var path = require('path');
            database = JSON.parse(fs.readFileSync(__dirname + '/../../server/data/posts.json'));
        }
        return database;
    }

    function saveDatabase() {
        if(database){
            const fs = require('fs');
            var path = require('path');
            fs.writeFile(__dirname + '/../../server/data/posts.json', JSON.stringify(database), (err) => {
                if (err) throw err;
            });
        }
       
        // window.localStorage.setItem('posts', JSON.stringify(database));
    }

    function getPosts(skip = 0, top = 10, filterConfig) {
        if (typeof skip === 'string')
            skip = parseInt(skip)
        if (typeof top === 'string')
            top = parseInt(top)

        if (!(typeof skip === 'number' && skip >= 0 && typeof top === 'number' && top >= 0))
            return {
                type: 'error',
                descriprion: 'wrong arguments'
            };

        let applyFilters = (filterConfig == null || Object.keys(filterConfig).length === 0)
            ? (post) => true
            : (post) => {
                let fields = Object.keys(filterConfig);
                return fields.every((field) => post[field] === filterConfig[field])
            };

        let posts = loadDatabase().slice(skip, skip + top).filter(applyFilters);

        return {
            type: 'success',
            posts: posts
        };
    }

    function getPostById(id) {
        if (typeof id === 'string')
            id = parseInt(id)

        let post = loadDatabase().find((element) => element.id == id);

        if (post == undefined)
            return {
                type: 'error',
                descriprion: 'post not found'
            };

        return {
            type: 'success',
            post: post
        };
    }

    function validatePhotoPost(post, fieldList) {
        if (fieldList == null || fieldList.length == 0) {
            fieldList = Object.keys(CONSTANTS.EXPRESSIONS);
            fieldList.splice(fieldList.indexOf('isString'), 1);
        }
        // debugger;
        // for (let i = 0; i < fieldList.length; i++) {
        //     let currFunc =CONSTANTS.EXPRESSIONS[fieldList[i]];
        //     let result = currFunc(post);
        // }
        return fieldList.every((expression) => CONSTANTS.EXPRESSIONS[expression](post));
    }

    function addPhotoPost(post) {
        loadDatabase();

        post.id = (database.length + 1).toString();
        if (!validatePhotoPost(post))
            return false;
        database.push(post);
        saveDatabase();
        return true;
    }

    function editPhotoPost(id, photoPost) {
        let searchResult = getPostById(id);
        if (searchResult.type == 'error')
            return false;

        let postToEdit = searchResult.post;
        CONSTANTS.EDITABLE_FIELD.forEach((field) => {
            if (photoPost.hasOwnProperty(field) && validatePhotoPost(photoPost, new Array(field)))
                postToEdit[field] = photoPost[field];
        });
        saveDatabase();
        return true;
    }

    function removePhotoPost(id) {
        let searchResult = getPostById(id);
        if (searchResult.type == 'error')
            return false;
        database.splice(database.indexOf(searchResult.post), 1);
        saveDatabase();
        return true;
    }

    return {
        getPosts: getPosts,
        getPostById: getPostById,
        validatePhotoPost: validatePhotoPost,
        addPhotoPost: addPhotoPost,
        editPhotoPost: editPhotoPost,
        removePhotoPost: removePhotoPost
    };
})();


module.exports = photoPosts;