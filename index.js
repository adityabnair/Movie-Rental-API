const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const cors = require('cors');

/*------------------------------------------
--------------------------------------------
parse application/json
---------------------= -----------------------
--------------------------------------------*/
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));
/*------------------------------------------
--------------------------------------------
Database Connection
--------------------------------------------
--------------------------------------------*/
const conn = mysql.createConnection({
  host: process.env['host'],
  user: process.env['user'],
  password: process.env['password'],
  database: 'sakila',
  multipleStatements: true // for executing multiple sql statements at a time
});

/*------------------------------------------
--------------------------------------------
Shows Mysql Connect
--------------------------------------------
--------------------------------------------*/
conn.connect((err) => {
  if (err) throw err;
  console.log('Mysql Connected with App...');
});

/**
 * Home page
 *
 *
 */
app.get('/', (req, res) => {
  res.end("You have reached the Home page of the sakila api The get requests endpoints used are as follows : \n /api/films \n /api/films/:id \n /api/films/:id/actors \n /api/actors \n /api/actors/:id \n /api/actors/:id/films \n /api/check_stock \n /api/process_rental \n /api/customer_data \n /api/customer_data/:id \n These can be appended to the homepage link according to known specific id's.");
  });

/**
 * Get All films
 *
 * @return response()
 */
app.get('/api/films', (req, res) => {
  let sqlQuery = "SELECT * FROM film";

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get Single film
 *
 * @return response()
 */
app.get('/api/films/:id', (req, res) => {
  let sqlQuery = "SELECT * FROM film WHERE film_id=" + req.params.id;

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});
/**
 * Get actors in a particular film
 *
 * @return response()
 */
app.get('/api/films/:id/actors', (req, res) => {

  let sqlQuery = "SELECT * from actor a where a.actor_id in (select a.actor_id from actor a inner join film_actor fa on a.actor_id = fa.actor_id inner join film f on fa.film_id = f.film_id WHERE f.film_id ="+ req.params.id+");" ;
  
  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get all actors
 *
 * @return response()
 */
app.get('/api/actors', (req, res) => {
  let sqlQuery = "SELECT * FROM actor";

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get single actor
 *
 * @return response()
 */
app.get('/api/actors/:id', (req, res) => {
  let sqlQuery = "SELECT * FROM actor WHERE actor_id=" + req.params.id;

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Get films starring a particular actor
 *
 * @return response()
 */
app.get('/api/actors/:id/films', (req, res) => {
  let sqlQuery = "SELECT * from film f where f.film_id in (select f.film_id from film f inner join film_actor fa on f.film_id = fa.film_id inner join actor a on fa.actor_id = a.actor_id WHERE a.actor_id =" + req.params.id + ")";

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Check how many specific films are in stock in a particular store
 *
 * @return response()
 */
app.get('/api/check_stock', (req, res) => {

  let film_id =  req.query.film_id;
  let store_id = req.query.store_id;
  let sqlQuery = `CALL sakila.film_in_stock(${film_id},${store_id}, @count); SELECT @count as num_in_stock;`

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});

/**
 * Inserting records for rental and payment
 *
 * @return response()
 */

app.get('/api/process_rental', (req, res) => {

  let customer_id =  req.query.customer_id;
  let inventory_id = req.query.inventory_id;
  let staff_id = req.query.staff_id;
  let amount = req.query.payment_amount;
  let sqlQuery = `call sakila.process_rental(${customer_id}, ${inventory_id},
  ${staff_id}, ${amount}, @new_payment_id, @new_rental_id);select @new_payment_id, @new_rental_id;`

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results[1]));
  });
});


/**
 * Get all rows from customer list view or return customers from specific country if requested
 *
 * @return response()
 */

app.get('/api/customer_data', (req, res) => {
  
  if(!req.query.country)
  {
    let sqlQuery = "SELECT * FROM customer_list";
    let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
   });
  }

  else
  {
    let country = req.query.country;
    let sqlQuery = `select * from customer_list c where c.country="${country}";`
    let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
   });
  }
});



/**
 * Get specific customer from customer list view using id
 *
 * @return response()
 */
app.get('/api/customer_data/:id', (req, res) => {
  let sqlQuery = "SELECT * FROM customer_list WHERE ID=" + req.params.id;

  let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
  });
});


/**
 * Get distance from input co-ordinates to UIC Student Center East
 *
 * @return response()
 */

app.get('/api/distance_from_UIC', (req, res) => {

  let latitude = req.query.latitude;
  let longitude = req.query.longitude;
  if(!req.query.units)
  {
    let sqlQuery = `select round(ST_Distance_Sphere(point(41.8685636,-87.6484497),point(${latitude}, ${longitude})),2) as distance, "meters" as units`;
    let query = conn.query(sqlQuery, (err, results) => {
    if (err) throw err;
    res.send(apiResponse(results));
   });
  }

  else
  {
    let units = req.query.units;
    if(units == "feet")
    {
      let sqlQuery = `select round(ST_Distance_Sphere(point(41.8685636, -87.6484497),point(${latitude},${longitude})) * 3.28084,2) as distance, "feet" as units`;
      let query = conn.query(sqlQuery, (err, results) => {
      if (err) throw err;
      res.send(apiResponse(results));
     });
    }
    else if(units == "miles")
    {
      let sqlQuery = `select round(ST_Distance_Sphere(point(41.8685636, -87.6484497),point(${latitude}, ${longitude})) * 0.000621371,2) as distance, "miles" as units`;
      let query = conn.query(sqlQuery, (err, results) => {
      if (err) throw err;
      res.send(apiResponse(results));
     });
    }
  }
});


/**
 * Update Item
 *
 * @return response()
 */

/**
 * Delete Item
 *
 * @return response()
 */

/**
 * API Response
 *
 * @return response()
 */
function apiResponse(results) {
  return JSON.stringify({ "status": 200, "error": null, "response": results });
}

/*------------------------------------------
--------------------------------------------
Server listening
--------------------------------------------
--------------------------------------------*/
app.listen(3000, () => {
  console.log('Server started on port 3000...');
});