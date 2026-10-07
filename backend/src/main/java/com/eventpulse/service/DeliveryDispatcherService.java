package com.eventpulse.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Dispatcher for asynchronous webhook delivery processing.
 * Dispatches deliveries onto a concurrent worker pool.
 */
@Service
public class DeliveryDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryDispatcherService.class);

    private final WebhookDeliveryWorker deliveryWorker;
    private final ExecutorService executorService;

    public DeliveryDispatcherService(WebhookDeliveryWorker deliveryWorker) {
        this.deliveryWorker = deliveryWorker;
        this.executorService = Executors.newFixedThreadPool(10, r -> {
            Thread t = new Thread(r);
            t.setName("webhook-delivery-worker-" + t.threadId());
            t.setDaemon(true);
            return t;
        });
    }

    public void dispatch(UUID deliveryId) {
        executorService.submit(() -> {
            try {
                deliveryWorker.processDelivery(deliveryId);
            } catch (Exception e) {
                log.error("Unhandled exception during delivery {}: ", deliveryId, e);
            }
        });
    }
}
