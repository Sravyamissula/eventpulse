package com.eventpulse.service;

import com.eventpulse.entity.EventDelivery;
import com.eventpulse.repository.EventDeliveryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Scheduled background service that polls for deliveries due for retry
 * and submits them back to the delivery dispatcher.
 */
@Service
public class RetrySchedulerService {

    private static final Logger log = LoggerFactory.getLogger(RetrySchedulerService.class);

    private final EventDeliveryRepository deliveryRepository;
    private final DeliveryDispatcherService dispatcherService;

    public RetrySchedulerService(EventDeliveryRepository deliveryRepository,
                                 DeliveryDispatcherService dispatcherService) {
        this.deliveryRepository = deliveryRepository;
        this.dispatcherService = dispatcherService;
    }

    @Scheduled(fixedDelay = 5000)
    public void schedulePendingRetries() {
        OffsetDateTime now = OffsetDateTime.now();
        List<EventDelivery> pendingRetries = deliveryRepository.findAllByStatusAndNextRetryAtBefore("RETRYING", now);

        if (!pendingRetries.isEmpty()) {
            log.info("Found {} deliveries due for retry", pendingRetries.size());
            for (EventDelivery delivery : pendingRetries) {
                // Clear nextRetryAt to avoid re-triggering while in-flight
                delivery.setNextRetryAt(now.plusMinutes(5));
                deliveryRepository.save(delivery);

                dispatcherService.dispatch(delivery.getId());
            }
        }
    }
}
