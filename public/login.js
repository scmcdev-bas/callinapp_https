$(function () {
  console.log("work");
  const btnLogin = document.getElementById("btn-login");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  btnLogin.addEventListener("click", (e) => {
    if(username.value==="customer1"&&password.value==="password"){
      localStorage.setItem("id","0970797919")
      window.location.href = "/"
    }else if(username.value==="customer2"&&password.value==="password"){
      localStorage.setItem("id","1")
      window.location.href = "/"
    }
  });
});
