const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Check if error has a status code
    const statusCode = err.statusCode || 500;
    
    // Send error response
    res.status(statusCode).json({
        msg: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorHandler; 