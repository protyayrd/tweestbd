const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/tweestbd', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

app.get("/", (req, res) => {
    return res.status(200).send({message: "welcome to ecommerce api - node"});
});

// Route registrations
const authRouter = require("./routes/auth.routes.js");
app.use("/auth", authRouter);

const userRouter = require("./routes/user.routes.js");
app.use("/api/users", userRouter);

const productRouter = require("./routes/product.routes.js");
app.use("/api/products", productRouter);

const adminProductRouter = require("./routes/product.admin.routes.js");
app.use("/api/admin/products", adminProductRouter);

const cartRouter = require("./routes/cart.routes.js");
app.use("/api/cart", cartRouter);

const cartItemRouter = require("./routes/cartItem.routes.js");
app.use("/api/cart_items", cartItemRouter);

const orderRouter = require("./routes/order.routes.js");
app.use("/api/orders", orderRouter);

const paymentRouter = require("./routes/payment.routes.js");
app.use('/api/payments', paymentRouter);

const reviewRouter = require("./routes/review.routes.js");
app.use("/api/reviews", reviewRouter);

const ratingRouter = require("./routes/rating.routes.js");
app.use("/api/ratings", ratingRouter);

const adminOrderRoutes = require("./routes/adminOrder.routes.js");
app.use("/api/admin/orders", adminOrderRoutes);

const categoryRouter = require("./routes/category.routes.js");
app.use("/api/categories", categoryRouter);
app.use("/api/admin/categories", categoryRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

module.exports = { app };