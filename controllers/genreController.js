var Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find().sort({name: 1}).exec((err, list_genres) => {
        if (err) { return next(err); }

        res.render('genre_list', { title: 'Genre List', genre_list: list_genres});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: callback => {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: callback => {
            Book.find({genre: req.params.id}).exec(callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.genre === null) {
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {title: 'Genre Details', genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {
        title: 'Create Genre'
    });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    //Sanitize and validate POST request
    body('name', 'Genre name required').trim().isLength({min:1}).escape(),
    //Begin process of adding Genre to DB
    (req, res, next) => {
        const errors = validationResult(req);
        let genre = new Genre(
            { name: req.body.name }
        );

        //This checks to see if there are any errors from the post request
        if (!errors.isEmpty()) {
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array()
            });
        } else {
            //Check to see if Genre exists already
            Genre.findOne({'name': req.body.name}).exec((err, found_genre) => {
                if (err) { return next(err); }

                if (found_genre) {
                    res.redirect(found_genre.url);
                } else {
                    genre.save(err => {
                        if (err) {return next(err); }
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: callback => {
            Genre.findById(req.params.id, callback);
        },
        books: callback => {
            Book.find({ genre: req.params.id}, callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }

        res.render('genre_delete', {
            title: 'Delete Genre',
            genre: results.genre,
            genre_books: results.books
        });
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: callback => {
            Genre.findById(req.body.genreid, callback);
        },
        books: callback => {
            Book.find({ genre: req.body.genreid}, callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }

        if (results.books > 0) {
            res.render('genre_delete', {
                title: 'Delete Genre',
                genre: results.genre,
                genre_books: results.books
            });
        } else {
            Genre.findByIdAndDelete(req.body.genreid, (err) => {
                if (err) {return next(err); }

                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    async.parallel({
        genre: callback => {
            Genre.findById(req.params.id, callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.genre === null) {
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }

        res.render('genre_form', {
            title: 'Update Genre',
            genre: results.genre
        });
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', 'Genre must have a name').trim().isLength({min:1}).escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', {
                title: 'Update Genre',
                genre: genre,
                errors: errors.array()
            });
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, theGenre) => {
                if (err) { return next(err); }

                res.redirect(theGenre.url);
            });
        }
    }
];
