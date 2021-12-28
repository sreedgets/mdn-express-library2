var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var async = require('async');
const { body, validationResult, check } = require('express-validator');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all Books.
exports.book_list = function(req, res, next) {

    Book.find({}, 'title author')
      .sort({title : 1})
      .populate('author')
      .exec(function (err, list_books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('book_list', { 
            title: 'Book List', 
            book_list: list_books });
      });
  
  };

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
    async.parallel({
        book: callback => {
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback);
        },
        book_instance: callback => {
            BookInstance.find({'book': req.params.id})
            .exec(callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.book === null) {
            const err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }

        //Successful, so render.
        res.render('book_detail', { 
            title: results.book.title, 
            book: results.book,
            book_instances: results.book_instance
        });
    });
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
    async.parallel({
        genres: callback => {
            Genre.find(callback)
        },
        authors: callback => {
            Author.find(callback)
        }
    }, (err, results) => {
        if (err) { return next(err); }

        res.render('book_form', {
           title: 'Add Book',
           genres: results.genres,
           authors: results.authors 
        });
    });
}

// Handle book create on POST.
exports.book_create_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    body('title', 'Title must not be empty.').trim().isLength({min:1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({min:1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min:1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min:1}).escape(),
    body('genre.*').escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if (!errors.isEmpty()) {
            async.parallel({
                genres: callback => {
                    Genre.find(callback)
                },
                authors: callback => {
                    Author.find(callback)
                }
            }, (err, results) => {
                if (err) { return next(err); }

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }

                res.render('book_form', {
                    title: 'Add Book',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                });
            });
        } else {
            book.save(err => {
                if (err) {return next(err); }

                res.redirect(book.url);
            });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: callback => {
            Book.findById(req.params.id, callback);
        },
        book_instances: callback => {
            BookInstance.find({ book: req.params.id}, callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.book === null) {
            res.redirect('/catalog/books');
        }

        res.render('book_delete', {
            title: 'Delete Book',
            book: results.book,
            book_instances: results.book_instances
        });
    });
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book: callback => {
            Book.findById(req.params.id, callback);
        },
        book_instances: callback => {
            BookInstance.find({ book: req.params.id }, callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }

        if (results.book_instances > 0) {
            res.render('author_delete', {
                title: 'Delete Book',
                book: results.book,
                book_instances: results.book_instances
            });
        } else {
            Book.findByIdAndRemove(req.body.bookid, (err) => {
                if (err) { return next(err); }

                res.redirect('/catalog/books');
            });
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    async.parallel({
       book: callback => {
           Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
       },
       authors: callback => {
           Author.find(callback);
       },
       genres: callback => {
           Genre.find(callback)
       }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.book === null) {
            const err = new Error('Book not found');
            err.status = 404;
            return next(err)
        }

        for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (let all_b_iter = 0; all_b_iter < results.book.genre.length; all_b_iter++) {
                if (results.genres[all_g_iter]._id.toString() === results.book.genre[all_b_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        res.render('book_form', {
            title: 'Update Book',
            authors: results.authors,
            genres: results.genres,
            book: results.book
        });
    });
};

// Handle book update on POST.
exports.book_update_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }

        next();
    },
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            async.parallel({
                authors: callback => {
                    Author.find(callback);
                },
                genres: callback => {
                    Genre.find(callback);
                }
            }, (err, results) => {
                if (err) { return next(err); }
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1 ) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', {
                    title: 'Update Book',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                });
            });
        } else {
            Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
                if (err) {return next(err); }
                res.redirect(thebook.url);
            });
        }
    }
];
