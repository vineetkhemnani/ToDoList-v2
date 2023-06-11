const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

mongoose.connect("mongodb+srv://admin-vineet:Test123@cluster0.sa0hfku.mongodb.net/todolistDB");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your ToDoList"
})

const item2 = new Item ({
    name: "Hit the + to add a new item"
})

const item3 = new Item ({
    name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];


// for every new list that we create, the list will have a name and an array of item documents
const listSchema = {
    name: String,
    // establishing relationships
    items: [itemsSchema]
    // items is an array of "itemsSchema based items"
}

//  create a collection called list
const List = mongoose.model('list', listSchema);

app.get("/about", function(req, res){
    res.render('about');
})

app.get('/',async function(req, res){
    // res.send('Hello');
   
        const foundItems = await Item.find();
        if (foundItems.length === 0){
            await Item.insertMany(defaultItems).then(()=>{console.log("Default Items added")}).catch((err) => console.log(err));
            res.redirect("/");
            // console.log(foundItems);
        } else {
            res.render('list', {listTitle: "Today", newListItems: foundItems});
        }  
});

// creating a dynamic list using a dynamic route
app.get('/:customListName', async function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    const foundList = await List.findOne({name: customListName});
    // console.log(foundList);
        if(!foundList){
            // console.log("Doesnt exist!!");
            // create a new list if it doesnt exist
            const list = new List({
                name: customListName,
                items: defaultItems
            });
        
            await list.save();
            res.redirect("/" + customListName);
        } else {
            // console.log("Exists");
            // Show an existing list
            res.render('list', { listTitle : foundList.name, newListItems: foundList.items})
        }
    
})

app.post('/', async function (req,res) {

    const itemName = req.body.newItem;  // passed from input type of post of home route in ejs
    const listName = req.body.list;     // passed from button of post of home route in ejs
    // listName contains name of the list user is currently adding item to

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        await item.save();
        res.redirect('/');
    } else {
        try {
            const foundList = await List.findOne({name: listName});
            foundList.items.push(item);
            await foundList.save();
            res.redirect('/' + listName);
            
        } catch (err) {
            console.log(err);
        }
    }
});

// delete items route
app.post('/delete', async function(req,res){
    const checkedItemId = (req.body.checkbox);
    const listName = req.body.listName;

    if(listName === "Today"){
        await Item.findByIdAndRemove(checkedItemId).then(()=> {
            console.log("Successfully deleted checked item");
            res.redirect("/");
        });

    } else {
        const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).catch((err)=>{console.log(err)});
        res.redirect("/" + listName);
    }

});


let port = process.env.PORT;
if (port == null || port == ""){
    port=3000;
}
app.listen(port, function(){
    console.log('Server started successfully on port ' + port);
});