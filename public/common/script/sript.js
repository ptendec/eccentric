let categoryOfProducts = ['Shoes', 'Bags', 'Accessories', 'Dress', 'Әтiр'];
let BrandOfProducts = ['Gucci', 'Burberry', 'Valentino', 'Dolce & Gabanna', 'Hogan', 'Moreschi', 'Givenchy'];

let checkboxes = document.querySelectorAll('input[type=checkbox][name=settings]');
let enabledSettings = [];
let products = document.querySelectorAll('.product');

checkboxes.forEach(function (checkbox){
    checkbox.addEventListener('change', function (event){
        enabledSettings =
        Array.from(checkboxes)
            .filter(i => i.checked)
            .map(i => i.value);
        let filterClass = event.target.dataset['f'];
        products.forEach( element => {
            if (element.classList.contains(filterClass) && element.classList.contains('hide')){
                element.classList.remove('hide');
            }
            else if (element.classList.contains(filterClass)){
                element.classList.add('hide');
            }


        } )
        console.log(enabledSettings)
    })
})