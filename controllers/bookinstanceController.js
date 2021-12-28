var BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find().populate('book').exec((err, list_bookinstances) => {
        if (err) {return next(err);}

        res.render('bookinstance_list', {
            title: 'Book Instance List', 
            bookinstance_list: list_bookinstances
        });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, book_instance) => {
        if (err) { return next(err); }
        if (book_instance === null) {
            const err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }

        //Successful, so render:
        res.render('bookinstance_detail', {
            title: 'Copy: ' + req.params.id,
            book_instance: book_instance
        });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec((err, books) => {
        if (err) { return next(err); }

        //Successful, so render:
        res.render('bookinstance_form', {
            title: 'Add Book Copy',
            book_list: books
        });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        const {book, imprint, status, due_back} = req.body;

        let bookinstance = new BookInstance({
            book: book,
            imprint: imprint,
            status: status,
            due_back: due_back

        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec((err, books) => {
                if (err) {return next(err); }

                res.render('bookinstance_form', {
                    title: 'Add Book Copy',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance
                });
            });    
        } else {
            bookinstance.save( err => {
                if (err) { return next(err); }

                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id, (err, bookInstance) => {
        if (err) { return next(err); }

        res.render('bookinstance_delete', {
            title: 'Delete Book',
            book_instance: bookInstance
        });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndDelete(req.body.bookinstanceid, (err) => {
        if (err) { return next(err); }

        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    //Change to async, get book instance and list of books
    async.parallel({
        book_instance: callback => {
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback);
        },
        book_list: callback => {
            Book.find(callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }

        /* res.send(results); */

        res.render('bookinstance_form', {
            title: 'Update Book Instance',
            bookinstance: results.book_instance,
            book_list: results.book_list
        });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        const {book, imprint, status, due_back} = req.body;

        let newInstance = new BookInstance({
            book: book,
            imprint: imprint,
            status: status,
            due_back: due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            async.parallel({
                book_instance: callback => {
                    BookInstance.findById(req.params.id)
                        .populate('book')
                        .exec(callback);
                },
                book_list: callback => {
                    Book.find(callback);
                }
            }, (err, results) => {
                if (err) { return next(err); }
        
                /* res.send(results); */
        
                res.render('bookinstance_form', {
                    title: 'Update Book Instance',
                    bookinstance: newInstance,
                    book_list: results.book_list,
                    errors: errors.array()
                });
            });
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, newInstance, {}, (err, theInstance) => {
                if (err) { return next(err); }

                res.redirect(theInstance.url);
            }); 
        }
    }
];
