const express = require('express');
const app = express();
const config = require('config');
const PORT = config.get('port') || 5000;
const mongoose = require('mongoose');
const request = require('request');
const bodyParser = require("body-parser");
const User = require('./models/User');
const Order = require('./models/Order')
const Product = require('./models/Product');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const ejs = require('ejs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Basket = require('./models/Basket');
const upload = require('express-fileupload');
const urlToGetWeather = "http://api.openweathermap.org/data/2.5/weather?q=Nur-Sultan&appid=a40d26da73cbb4771a2ecd16b98ad89c";

const http = require('http');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
async function start(){
    try{
        await mongoose.connect(config.get('mongoURI'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });

        app.listen(PORT, () => console.log(`App has been started on port ${PORT}`));
        app.set('view engine', 'ejs');
    }catch (e){
        console.log('Server error: ', e.message);
        process.exit(1);
    }
}
app.use(upload())
start();
app.use(session({
    secret: 'secret for web',
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000 * 60 * 60 * 24
    }
}))
app.use('/public', express.static('public'));
app.use('/views', express.static('views'));
app.get('/signIn',function (req, res){
    res.sendFile(__dirname + '/views/sign_in.html')
})
app.get('/signUp',function (req, res){
    res.sendFile(__dirname + '/views/sign_up.html')
})
app.post('/registration',
    [
        check('email', "Incorrect email").isEmail(),
        check('password', 'Minimal length of password 6 symbols').isLength({min: 6})
    ],
    async (req, res) => {
        try{
            const errors = validationResult(req)
            if (!errors.isEmpty()){
                return res.status(400).json({
                    errors: errors.array(),
                    message: "Invalid data for registration"})
            }
            const {email, firstName, lastName, password, address, telephone} = req.body
            const candidate = await User.findOne({email})
            if (candidate){
                return res.status(400).json({message: 'User already exists'})
            }
            const hashedPassword = await bcrypt.hash(password, 12)
            const user = new User ({email, password: hashedPassword, address, firstName, lastName, telephone})

            await user.save()

            req.session.userId = user.id;
            req.session.firstName = user.firstName;
            req.session.lastName = user.lastName;
            //console.log(currentSession.userId)
            res.redirect('/')

        }
        catch (e){
            res.status(500).json({message: 'Something went wrong, try again'})
        }

    }
);
app.post('/authorization',
    [
        check('email', 'Input correct email').normalizeEmail().isEmail(),
        check('password', 'Input password').exists()
    ],
    async (req, res) => {
        try{
            const errors = validationResult(req)
            if (!errors.isEmpty()){
                return res.status(400).json({
                    errors: errors.array(),
                    message: "Invalid data for registration"})
            }
            const {email, password} = req.body
            const user = await User.findOne({email})
            if (!user){
                return res.status(400).json({message: 'User didn\'t found'})
            }
            console.log(user.password + "\n" + password)
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch){
                return res.status(400).json({
                    message: "Incorrect email or password, try again"
                })
            }
            const token = jwt.sign(
                {
                    userId: user.id
                },
                config.get('jwtSecret'),
                {
                    expiresIn: '24h'
                }
            )


            req.session.userId = user.id;
            req.session.firstName = user.firstName;
            req.session.lastName = user.lastName;
            //console.log(currentSession.userId)
            res.redirect('/')
        }
        catch (e){
            res.status(500).json({message: 'Something went wrong, try again'})
        }
    }
);
app.get('/', function (req, res){
    request(urlToGetWeather, function (err, response, body) {
        const weather_json = JSON.parse(body);
        Product.find()
            .then((result) => {
                res.render(__dirname + '/views/index', {weather_json, products: result ,userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
            })
        });

    //req.session.destroy();
})
app.get('/logout', function (req, res){
    req.session.destroy();
    res.redirect('/')
})
app.get('/products', function (req, res){
    /*const all = Product.find({});
    for(let i = 0; i < all.length; i++){
        console.log(all[i].name + "\n" + i);
    }*/
    Product.find()
        .then((result) => {
            let products = result;
            res.render(__dirname + '/views/products', {products,userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
        })

})
app.get('/addProduct', function (req, res){
    res.render(__dirname + '/views/addProduct', {userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName});
})
app.post('/addProductProcess',
    async (req, res) => {
    try{
        const {nameOfProduct, description, price, image, brand, category} = req.body
        console.log(nameOfProduct + "\n")
        const product = new Product({name: nameOfProduct, description, price, brand, image, category})
        await product.save()
        console.log(product.name)
        res.status(201).json({message: "Product successfully created"})

    }
    catch (e){
        res.status(500).json({message: 'Something went wrong, try again'})
    }

})
app.get('/productPage/:id', function (req, res){
    let productId = req.params.id;
    Product.findById(productId)
        .then((result) => {
            const foundProduct = result;
            res.render(__dirname + '/views/product_page', {product: foundProduct,userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
        })
})

app.post('/addToBasket', function (req, res){
    try {
        const {productId, size, amount} = req.body
        const userId = req.session.userId;
        //res.send(userId + "<br>" + productId)
        Product.findById(productId)
            .then((result) => {
              const foundProduct = result;
                console.log(foundProduct.name)
                const basket = new Basket({userId, product: [{name: foundProduct.name, description: foundProduct.description,
                        price: foundProduct.price, brand: foundProduct.brand, image: foundProduct.image, category: foundProduct.category}], size, amount})
                if (req.session.userId != undefined){
                    basket.save();
                }
            })
    res.redirect('/');
    } catch (e) {
        res.status(500).json({message: 'Something went wrong, try again'})
    }
})
app.get('/basket', function (req, res){
    Basket.find({userId: req.session.userId})
        .then((result) => {
            const foundProduct = result;

            res.render(__dirname + '/views/basket', {products: foundProduct, userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
        })
})
app.get('/deleteFromBasket/:basketId', function (req, res){
    const basketId = req.params.basketId;
    Basket.findByIdAndDelete(basketId)
        .then((result) => {
            res.redirect('/basket')
        })
})
app.get('/order/:basketId', function (req, res){
    const basketId = req.params.basketId;
    Basket.findById(basketId)
        .then((result) => {
            res.render(__dirname + '/views/order', {product: result, userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
        })
})
app.post('/confirmOrder', function (req, res){
    const {basketId, check} = req.body
    if (check !== ''){
        Basket.findById(basketId)
            .then((result) => {
                const order = new Order;
                order.userId = result.userId;
                order.product[0] = result.product[0];
                order.size = result.size;
                order.amount = result.amount;
                order.status = "Ordered";
                order.check = check;
                order.save();
            })
        Basket.findByIdAndDelete(basketId)
            .then((result) => {
                res.redirect('/')
            })
    }
})
app.get('/myOrders', function (req, res){
    Order.find({userId: req.session.userId})
        .then((result) => {
            console.log(result)
            res.render(__dirname + '/views/myOrders', {products: result, userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
        })

})
app.get('/adminPanel', function (req, res){
    Order.find({userId: req.session.userId})
        .then((result) => {
            console.log(result)
            res.render(__dirname + '/views/admin_panel', {products: result, userId: req.session.userId, firstName: req.session.firstName, lastName: req.session.lastName})
        })
})
app.get('/changeStatus/:orderId', function (req, res){
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then((result) => {
            if (result.status === 'Ordered'){
                Order.findByIdAndUpdate(orderId, {status: 'Delivering'})
                    .then((result) => {
                        res.redirect(req.headers.referer)
                    })
            }
            else if(result.status === 'Delivering'){
                Order.findByIdAndUpdate(orderId, {status: 'Delivered'})
                    .then((result) => {
                        res.redirect(req.headers.referer)
                    })
            }
            else if(result.status === 'Delivered'){
                Order.findByIdAndUpdate(orderId, {status: 'Done'})
                    .then((result) => {
                        res.redirect(req.headers.referer)
                    })
            }
        })
})
