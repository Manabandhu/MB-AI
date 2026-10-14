package com.manabandhu.backend.rides;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;

/** Decides how much of a ride each viewer sees; see {@link RideOfferView}. */
@Component
public class RideViews {

    private final RideAccess access;

    RideViews(RideAccess access) {
        this.access = access;
    }

    /** One ride: the driver, admins, and passengers are members. */
    @Transactional(readOnly = true)
    public RideOfferView view(RideOffer offer, Actor viewer) {
        var isDriver = viewer != null && viewer.is(offer.getDriverId());
        var isMember = viewer != null && (isDriver || viewer.admin() || access.isPassenger(viewer.id(), offer.getId()));
        return RideOfferView.of(offer, isDriver, isMember);
    }

    /** Rides the viewer is known to belong to (their own offers, trips, saved rides they joined). */
    @Transactional(readOnly = true)
    public List<RideOfferView> views(List<RideOffer> offers, Actor viewer) {
        return offers.stream().map(offer -> view(offer, viewer)).toList();
    }

    /** Search results: passenger checks are skipped for speed, so only the driver and admins count as members. */
    public List<RideOfferView> searchViews(List<RideOffer> offers, Actor viewer) {
        return offers.stream().map(offer -> {
            var isDriver = viewer != null && viewer.is(offer.getDriverId());
            return RideOfferView.of(offer, isDriver, isDriver || (viewer != null && viewer.admin()));
        }).toList();
    }
}
