const mongoose = require('mongoose')

//mDVk9h68Sqvm1tZK

//mongodb+srv://VaishaliSharath:mDVk9h68Sqvm1tZK@cluster0.ocr2e.mongodb.net/eLearn
url = 'mongodb+srv://VaishaliSharath:W31NHKg9k1LSNIVU@cluster0.ocr2e.mongodb.net/vendingmachine?retryWrites=true&w=majority'

/* mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}) */

mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})


