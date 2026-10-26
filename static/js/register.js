async function register(){


const username =
document.getElementById("username").value;


const email =
document.getElementById("email").value;


const password =
document.getElementById("password").value;



if(!username || !email || !password){

    document.getElementById("message")
    .innerText="Fill all fields";

    return;

}



try{


const response = await fetch("/register",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

username,
email,
password

})

});



const result =
await response.json();



if(result.success){


document.getElementById("message")
.innerText="Account created. Redirecting...";


setTimeout(()=>{

window.location="/verify";

},1500);



}

else{


document.getElementById("message")
.innerText=result.error;


}


}

catch(err){

console.error(err);

document.getElementById("message")
.innerText="Server error";

}


}
