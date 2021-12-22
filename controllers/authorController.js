var Author = require('../models/author');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find().sort([['family_name', 'ascending']]).exec((err, list_author) => {
        if (err) { return next(err); }

        res.render('author_list', {
            title: 'Author List', 
            author_list: list_author
        });
    });
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {
    async.parallel({
       author: callback => {
           Author.findById(req.params.id).exec(callback);
       },
       books: callback => {
           Book.find({'author': req.params.id}).exec(callback);
       } 
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.author === null) {
            const err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }

        //Successful, so render:
        res.render('author_detail', {
            title: results.author.name,
            author: results.author,
            books: results.books
        })
    });
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', { title: 'Add Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({min:1}).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true })
        .isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true })
        .isISO8601().toDate(),
    (req, res, next) => {
        const errors = validationResult(req);

        let author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        });

        if (!errors.isEmpty()) {
            res.render('author_form', {
                title: 'Add Author',
                author: author,
                errors: errors.array()
            });
        } else {
            Author.findOne({
                'first_name': req.body.first_name, 
                'family_name': req.body.family_name
            }).exec((err, found_author) => {
                if (err) { return next(err); }

                if (found_author) {
                    res.redirect(found_author.url);
                } else {
                    author.save( err => {
                        if (err) { return next(err); }
                        res.redirect(author.url);
                    });
                }
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};
