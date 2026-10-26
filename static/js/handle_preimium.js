//show premium
function openPremiumOverlay(){

    const overlay = document.getElementById("premium-overlay");

    if(overlay){

        overlay.classList.add("open");

    }

}



function closePremiumOverlay(){

    const overlay = document.getElementById("premium-overlay");

    if(overlay){

        overlay.classList.remove("open");

    }

}