var BookInstance = require('../models/bookinstance');

const async = require('async');

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
exports.bookinstance_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance create GET');
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance create POST');
};

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance delete GET');
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance delete POST');
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};
