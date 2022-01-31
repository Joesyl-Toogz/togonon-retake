const express= require('express');
const bodyParser= require('body-parser');
const uuid= require('uuid');
const mysql= require('mysql');
const path = require('path');
require('dotenv').config();
const util = require('util')
const app= express();
const port = process.env.PORT || 5000;
//body parser is a parsing middleware
//parsing middleware
//parse application/www.
app.use(bodyParser.urlencoded({extended:false}))
 
// Install cookieparser, express-session: To Create Session
var cookieParser= require('cookie-parser')
var session= require('express-session')
app.use(cookieParser());
app.use(session({secret: "Shh, its a secret!",saveUninitialized:true, resave: false}));
 
 
// Parse application.json
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));
//Templating Engine
// app.engine('hbs', exphbs( {extname: '.hbs'}));
app.set('view engine','ejs');

const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'retake'
});

db.connect((err)=>{
    if(err) throw err
    console.log("Connected to db")
})


app.all("/login",(req,res)=>{
    //check post
    if(req.method=="POST"){
        const params=req.body
        const sql= `SELECT id,username,fname,lname,contactno,email,role FROM users WHERE username="${params.username}" and password= "${params.password}"`
        db.query(sql,(err,results)=>{
            if (err) throw err;
            console.log(results)
            if (results.length==0){
                res.render("login",{error:true})
 
            }else{
                var session=req.session
                session.userid={id:results[0].id}
                session.role={role:results[0].role}
                session.username={name:results[0].username}
                session.fname={name:results[0].fname}
                session.lname={name:results[0].lname}
                session.contactno={contactno:results[0].contactno}
                session.email={email:results[0].email}
                console.log("Signed In"+session)
                if (session.role.role=="admin"){
                        res.redirect("/admin_homepage")
                }else{
                    res.redirect("/user_homepage")
                }
            }
        })
    }else{
        res.render("login",{error:false})
    }
 
 
})
app.get("/vieworder/:id",(req,res)=>{
    var params=req.params;
    var session= req.session
    if(req.session.userid!=null){
    const sql=`SELECT retake.order.order_date, retake.order.order_group, status, food_price,food_name,quantity,mop,mods,purchased FROM food INNER JOIN retake.order ON food.id = retake.order.food_id INNER JOIN users ON users.id = ${session.userid.id} WHERE retake.order.order_group = '${params.id}';`
        db.query(sql, (err, rows) => {
            console.log(sql)
            res.render("vieworder",{user_data:session,other_data:rows,error:null})
        })
    }else{
        res.redirect("/")
    }

 
})
app.all("/editprofile/:id",(req,res)=>{
    if (req.method=="POST"){

    
    var params=req.body;
    var session= req.session
    if(req.session.userid!=null){
    const sql=`UPDATE users SET username='${params.username}', password='${params.password}',fname='${params.fname}',lname='${params.lname}',contactno='${params.contactno}',email='${params.email}' WHERE id= '${session.userid.id}';`
        db.query(sql, (err, rows) => {
            console.log(sql)
            res.redirect("/logout")
        })
    }else{
        res.redirect("/")
    }
}else{
    var params=req.params;
    var session= req.session
    if(req.session.userid!=null){
        const sql=`SELECT * FROM users WHERE id = '${session.userid.id}';`
            db.query(sql, (err, rows) => {
                console.log("MMEEEE"+sql)
                res.render("editprofile",{user_data:session,data:rows,error:null})
            })

        }else{
            res.redirect("/")
        }
   
}
 
})






app.all("/user_homepage",(req,res)=>{
    if(req.method=="POST"){
            var params=req.body;
            var session=req.session;
            params.userid=req.session.userid.id;
            delete params['fname']
            delete params['lname']
            console.log("Delivered:"+params.userid)
            const sql="INSERT INTO retake.applicationform SET ?";
            db.query(sql,params,(err,result)=>{
                if (err) throw err
                //start
                res.redirect("/user_homepage");
               
            })
     
    
    }else{
        var session=req.session
        const sqlyarn=`SELECT * FROM retake.order WHERE retake.order.user_id =${session.userid.id} GROUP BY order_group  `;
        const sql1 = `SELECT retake.order.order_date, status, food_name,quantity,food_price FROM food INNER JOIN retake.order ON food.id = retake.order.food_id INNER JOIN users ON users.id = ${session.userid.id} `;  
        // const sql1= SELECT * FROM retake.order WHERE user_id=${req.session.userid.id}
        console.log(sqlyarn)
        
        console.log("Hahaha"+session.userid.id)
        db.query(sql1,(err1,results5)=>{
            if (err1) throw err1;
            console.log(results5)
            if (results5.length==0){
                
 
            }else{
                db.query(sqlyarn,(err1,results1)=>{
                    if (err1) throw err1;
                    console.log(results1)
                    if (results1.length==0){
                        res.render("user_homepage",{operation:null,data:null,user_data:session});
         
                    }else{
                        res.render("user_homepage",{operation:null,data:results1,other_data:results5,user_data:session});
                    }})
            }})
        
          
            

        
    
}
})
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect('/');
 
})


app.all("/signup",(req,res) =>{
    if (req.method=="POST"){
        var params=req.body;
        params.role="guest";
        console.log(params)
        const sql="INSERT INTO users SET ?";
        db.query(sql,params,(err,result)=>{
            if (err) throw err
 
        db.query("SELECT LAST_INSERT_ID() as id",(err1,result1)=>{
            if (err1) throw err1
            var session= req.session
            console.log(session)
            session.username = {name:params.username}
            session.fname={name:params.fname}
            session.lname={name:params.lname}
            session.userid = {id:result1[0].id}
            session.role = {role:params.role}
            console.log(params.username)
            res.locals.user=params.username
            res.redirect("/user_homepage");

 
        })
 
        })
 
    }else{
        res.render('signup',{error:false})
    }
})
app.get("/approve/:id",(req,res)=>{
    var params=req.params;
    var session=req.session;
    if(req.session.userid!=null){
    const sql=`UPDATE retake.order SET status="approved" WHERE order_group= '${params.id}'`
        db.query(sql, (err, rows) => {
            console.log(sql)
            res.redirect("/admin_homepage",)
        })
    }else{
        res.redirect("/")
    }

 
})

app.get("/decline/:id",(req,res)=>{
    var params=req.params;
    var session=req.session;
    if(req.session.userid!=null){
    const sql=`UPDATE retake.order SET status="declined" WHERE order_group= '${params.id}'`
        db.query(sql, (err, rows) => {
            console.log(sql)
            res.redirect("/admin_homepage",)
        })
    }else{
        res.redirect("/")
    }

 
})
app.get("/deliver/:id",(req,res)=>{
    var params=req.params;
    var session=req.session;
    if(req.session.userid!=null){
    const sql=`UPDATE retake.order SET status="deliver" WHERE order_group= '${params.id}'`
        db.query(sql, (err, rows) => {
            console.log(sql)
            res.redirect("/admin_homepage",)
        })
    }else{
        res.redirect("/")
    }

 
})

app.all("/admin_homepage",(req,res)=>{
    if (req.session.userid!=null && req.session.role.role!="admin"){
        res.redirect('/user_homepage')
    }
    if(req.method=="POST"){
            var params=req.body;
            var session=req.session;
            params.userid=req.session.userid.id;
            delete params['fname']
            delete params['lname']
            console.log("Delivered:"+params.userid)
            const sql="INSERT INTO retake.applicationform SET ?";
            db.query(sql,params,(err,result)=>{
                if (err) throw err
                //start
                res.redirect("/admin_homepage");
               
            })
     
    
    }else{
        var session=req.session
        const sqlyarn=`SELECT * FROM retake.order GROUP BY order_group  `;
        const sql1 = `SELECT retake.order.order_date, status, food_name,quantity,food_price FROM food INNER JOIN retake.order ON food.id = retake.order.food_id`;
        // const sql1= `SELECT * FROM retake.order WHERE user_id=${req.session.userid.id}`
        console.log(sqlyarn)
        
        console.log("Hahaha"+session.userid.id)
        db.query(sql1,(err1,results5)=>{
            if (err1) throw err1;
            console.log(results5)
            if (results5.length==0){
                
 
            }else{
                db.query(sqlyarn,(err1,results1)=>{
                    if (err1) throw err1;
                    console.log(results1)
                    if (results1.length==0){
                        res.render("admin_homepage",{operation:null,data:null,user_data:session});
         
                    }else{
                        res.render("admin_homepage",{operation:null,data:results1,other_data:results5,user_data:session});
                    }})
            }})

        
    
}
})
app.all("/order",(req,res)=>{
    if (req.method=="POST"){
        var params=req.body;
        var order_id="";
        console.log(util.inspect(params, {showHidden: false, depth: null, colors: true}))
        var session=req.session;
        console.log("kkkk"+params.id_array[1])
        var food_ids = params.id_array.split(',').map(function(item) {
            return parseInt(item, 10);
        });
        var purchased_quantity = params.purchased_array.split(',').map(function(item) {
            return parseInt(item, 10);
        });
        
        var food_idquantity=[];
        const unique_id=uuid.v4()

        for (let i = 0; i < purchased_quantity.length; i++) {
            if(purchased_quantity[i]!=0 && order_id==""){
        const sql=`INSERT INTO retake.order (food_id,quantity,user_id, status,order_date,order_group,mop,mods,purchased) VALUES ('${food_ids[i]}','${purchased_quantity[i]}','${session.userid.id}', 'pending',NOW(), '${unique_id}','${params.mop}','${params.mod}','${params.purchased}')`;
        
        db.query(sql,(err1,results1)=>{
            if (err1) throw err1;
            console.log(results1)
          
        })
                
            
        }
        
    }
    res.redirect("/user_homepage")
        

    }else{

    
    var params=req.params;
    var session=req.session;
    users_id=params.id;
    sql1=`SELECT * FROM retake.food`;
    db.query(sql1,(err1,results1)=>{
        if (err1) throw err1;
        console.log(results1)
        res.render("order",{user_data:session,error:null,data:results1})
    })
    // res.render("order",{user_data:session,error:null,data:results1})

}
})
app.all("/user_homepage",(req,res)=>{
    if(req.method=="POST"){
            var params=req.body;
            var session=req.session;
            params.userid=req.session.userid.id;
            delete params['fname']
            delete params['lname']
            console.log("Delivered:"+params.userid)
            const sql="INSERT INTO retake.applicationform SET ?";
            db.query(sql,params,(err,result)=>{
                if (err) throw err
                //start
                res.redirect("/user_homepage");
               
            })
     
    
    }else{
        var session=req.session
        const sqlyarn=`SELECT * FROM retake.order WHERE retake.order.user_id =${session.userid.id} GROUP BY order_group  `;
        const sql1 = `SELECT retake.order.order_date, status, food_name,quantity,food_price FROM food INNER JOIN retake.order ON food.id = retake.order.food_id INNER JOIN users ON users.id = ${session.userid.id} `;
        // const sql1= `SELECT * FROM retake.order WHERE user_id=${req.session.userid.id}`
        console.log(sqlyarn)
        
        console.log("Hahaha"+session.userid.id)
        db.query(sql1,(err1,results5)=>{
            if (err1) throw err1;
            console.log(results5)
            if (results5.length==0){
                
 
            }else{
                db.query(sqlyarn,(err1,results1)=>{
                    if (err1) throw err1;
                    console.log(results1)
                    if (results1.length==0){
                        res.render("user_homepage",{operation:null,data:null,user_data:session});
         
                    }else{
                        res.render("user_homepage",{operation:null,data:results1,other_data:results5,user_data:session});
                    }})
            }})
        
          
            

        
    
}
})




app.all("/weoffer" ,(req,res)=>{
    res.render("weoffer");

});
app.all("/technologystack" ,(req,res)=>{
    res.render("technologystack");
    

});
app.all("/location" ,(req,res)=>{
    res.render("location");

});
app.all("/contactus" ,(req,res)=>{
    res.render("contactus");

});

app.get("/",(req,res)=>{
    res.render("index" );
});

app.listen(process.env.PORT||3000);
console.log("app is running")
