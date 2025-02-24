const mongoose = require("mongoose")

const mongoDbUrl='mongodb://127.0.0.1:27017/tweestbd'

const connectDb = async () => {
    try {
        console.log("Connecting to MongoDB at:", mongoDbUrl);
        const conn = await mongoose.connect(mongoDbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log("Database name:", conn.connection.name);
        console.log("Connection state:", conn.connection.readyState);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports={connectDb}

