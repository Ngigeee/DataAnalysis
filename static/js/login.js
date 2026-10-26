async function login(){


const email =
document.getElementById("email").value;


const password =
document.getElementById("password").value;



const response =
await fetch("/login_user",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email,
password

})

});



const result =
await response.json();



if(result.success){


window.location="/home";


}

else{


document.getElementById("message")
.innerText=result.error;


}


}
