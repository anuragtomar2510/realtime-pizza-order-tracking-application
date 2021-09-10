const Order = require('../../../models/order');

function statusController () {

        return { 

                update(req, res) {


                        Order.findOne({_id : req.body.orderId}).then((order) => {

                                if(order.paymentType === 'COD' && req.body.status === 'delivered') {

                                                order.paymentStatus = true

                                }

                                order.status = req.body.status

                                order.save().then((ord) => {

                                                // Emit event
                                        const eventEmitter = req.app.get('eventEmitter')
                                        eventEmitter.emit('orderUpdated', ord)
                                        return res.redirect('/admin/orders')


                                }).catch((error) => {

                                        return res.redirect('/admin/orders')
                                })

                        }).catch((error) => {

                                return res.redirect('/admin/orders')

                        })
                           

                               
                
                }
        }

}

module.exports = statusController;