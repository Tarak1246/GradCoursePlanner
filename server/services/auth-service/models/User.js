const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        index:true,
        validate: {
            validator: function(value) {
                return /^[a-zA-Z0-9._%+-]+@wright\.edu$/.test(value);
            },
            message: props => `${props.value} is not a valid @wright.edu email address`
        }
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student',required: true },
    programOfStudy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProgramOfStudy' }], // References to Program documents
    coursesTaken: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],   // References to Course documents
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
});

// Method to compare password for login
userSchema.methods.isValidPassword = function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
