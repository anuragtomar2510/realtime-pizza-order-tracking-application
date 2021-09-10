import axios from 'axios';
import moment from 'moment';
import Noty from 'noty';
import {loadStripe} from '@stripe/stripe-js';

let socket = io()
let addToCart = document.querySelectorAll(".add-to-cart");


function updateCart(pizza) {

        axios.post('/update-cart', pizza)
        .then((res) => {

                cartCounter.innerText = res.data.totalQty;

                new Noty({

                        type : 'success',
                        timeout : 1000,
                        text : 'Pizza added to cart',
                        progressBar : false 

                }).show();

        }).catch((err) => {

                new Noty({

                        type : 'error',
                        timeout : 1000,
                        text : 'Something went wrong',
                        progressBar : false 
                        
                }).show();

        });
}

addToCart.forEach((btn) => {

        btn.addEventListener('click', (e) => {

                let pizza = JSON.parse(btn.dataset.pizza);
                updateCart(pizza);

        })
})


const alertMsg = document.querySelector("#success-alert");

if(alertMsg) {

        setTimeout(() => {

                alertMsg.remove();

        }, 2000);
        
}


function initAdmin() {

        const orderTableBody = document.querySelector('#orderTableBody');

        let orders = []
        let markup
    
        axios.get('/admin/orders', {

            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }

        }).then(res => {

            orders = res.data
            markup = generateMarkup(orders)
            orderTableBody.innerHTML = markup

        }).catch(err => {

            console.log(err)

        })

        
        function renderItems(items) {

        let parsedItems = Object.values(items)
        return parsedItems.map((menuItem) => {
        return `
                <p>${ menuItem.item.name } - ${ menuItem.qty } pcs </p>
        `
        }).join('')

      }

      function generateMarkup(orders) {
        return orders.map(order => {
            return `
                <tr>
                <td class="border px-4 py-2 text-green-900 text-center">
                    <p>${ order._id }</p>
                    <div>${ renderItems(order.items) }</div>
                </td>
                <td class="border px-4 py-2 text-center">${ order.customerId.name }</td>
                <td class="border px-4 py-2 text-center">${ order.phone }</td>
                <td class="border px-4 py-2 text-center">${ order.address }</td> 
                <td class="border px-4 py-2 text-center">
                    ${ moment(order.createdAt).format('hh:mm A') }
                </td>

                <td class="border px-4 py-2 text-center">${ order.paymentStatus ? 'Paid' : 'Not paid yet'}</td> 
                
                <td class="border px-4 py-2 text-center">
                <div class="inline-block relative w-54">
                    <form action="/admin/order/status" method="POST">
                        <input type="hidden" name="orderId" value="${ order._id }">
                        <select name="status" onchange="this.form.submit()"
                            class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
                            <option value="order_placed"
                                ${ order.status === 'order_placed' ? 'selected' : '' }>
                                Placed</option>
                            <option value="confirmed" ${ order.status === 'confirmed' ? 'selected' : '' }>
                                Confirmed</option>
                            <option value="prepared" ${ order.status === 'prepared' ? 'selected' : '' }>
                                Prepared</option>
                            <option value="delivered" ${ order.status === 'delivered' ? 'selected' : '' }>
                                Delivered
                            </option>
                            <option value="completed" ${ order.status === 'completed' ? 'selected' : '' }>
                                Completed
                            </option>
                        </select>
                    </form>
                    <div
                        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20">
                            <path
                                d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
            </td>
            </tr>
        `
        }).join('')
    }

    socket.on('orderPlaced', (order) => {
        new Noty({

            type : 'success',
            timeout : 1000,
            text : `New Order`,
            progressBar : false 
    
        }).show();

        orders.unshift(order)

        // Update Table
        orderTableBody.innerHTML = ''
        orderTableBody.innerHTML = generateMarkup(orders)

    })

   

}





let hiddenInput = document.querySelector('#hiddenInput');
let order = hiddenInput ? hiddenInput.value : null;
order = JSON.parse(order);
let statuses = document.querySelectorAll('.status-line');
let time = document.createElement('small');

function updateStatus(order) {

    
    statuses.forEach((status) => {
        status.classList.remove('step-completed')
        status.classList.remove('current-status')
    })

    let stepCompleted = true;

    statuses.forEach((status) => {

        let dataProp = status.dataset.status;

        if(stepCompleted) {

            status.classList.add('step-completed');

        }

        if(dataProp === order.status) {

            stepCompleted = false;

            time.innerText = moment(order.updatedAt).format('hh : mm A');

            status.appendChild(time);

            if(status.nextElementSibling) {

                status.nextElementSibling.classList.add('current-status');

            }
            

        }
    })
}

updateStatus(order);










// Socket




if(order) {
    
    socket.emit('join', `order_${order._id}`)
    
}

let adminAreaPage = window.location.pathname
if(adminAreaPage.includes('admin')){

    initAdmin();
    socket.emit('join', 'adminRoom')

}



socket.on('orderUpdated', (data) => {

  
    const updatedOrder = {...order};
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status
    updatedOrder.paymentStatus = data.paymentStatus
    updateStatus(updatedOrder)
    
    
    new Noty({

        type : 'success',
        timeout : 1000,
        text : `Order ${data.status}`,
        progressBar : false 

    }).show();
})



// Placing order

async function initStripe() {

            const stripe = await loadStripe('pk_test_51JT1RZSHTN5t1WEByII6tNBplJvHORN0HUVLHY7HnwjWUZAtcyyq8iRJjxG5glaxvWZwU6JE3LGkYEqlkynMkxbd00WpavRtA6');

            let card = null;
            function mountWidget () {

            
                    var style = {
                        base: {
                        color: '#303238',
                        fontSize: '16px',
                        fontFamily: '"Open Sans", sans-serif',
                        fontSmoothing: 'antialiased',
                        '::placeholder': {
                            color: '#CFD7DF',
                        },
                        },
                        invalid: {
                        color: '#e5424d',
                        ':focus': {
                            color: '#303238',
                        },
                        },
                    };


                    const elements = stripe.elements()
                    card = elements.create('card', {style : style, hidePostalCode : true})
                    card.mount('#card-element')

            }
            



            const paymentType = document.querySelector('#paymentType')
            
            if(!paymentType) {

                return;

            }

            paymentType.addEventListener('change', (e) => {

                if(e.target.value === 'card') {

                        // mount widget
                        mountWidget()

                } else {

                        card.destroy()
                }

            })


            function placeOrder(formObject){

                 axios.post('/order', formObject).then((res) => {
            
                            new Noty({
            
                                type : 'success',
                                timeout : 1000,
                                text : res.data.message,
                                progressBar : false 
                        
                            }).show();
            
                            setTimeout(() => {
            
                                window.location.href = '/customer/orders'
            
                            }, 1000)
                                
            
                        }).catch((err) => {
            
                            new Noty({
            
                                type : 'error',
                                timeout : 1000,
                                text : res.data.message,
                                progressBar : false 
                        
                            }).show();
            
                            setTimeout(() => {
            
                                window.location.href = '/cart'
            
                            }, 1000)
            
                        })

            }



            const paymentForm = document.querySelector("#payment-form")
            if(paymentForm) {

                    paymentForm.addEventListener('submit', (e) => {

                        e.preventDefault()

                        let formData = new FormData(paymentForm)
            
                        let formObject = {}
            
                        for(let [key, value] of formData.entries()){
            
                                formObject[key] = value
            
                        }


                        // Check if it is COD then place order now
                        if(!card) {

                            placeOrder(formObject)
                            return;
                            
                        }


                        // Verify card 
                        stripe.createToken(card).then((result) => {

                                // Got token, now append it in formObject
                                formObject.stripeToken = result.token.id
                                placeOrder(formObject)

                        }).catch((err) => {

                                console.log(err)
                                
                        })
            
                       
                        
                })
            }
           
}


initStripe()