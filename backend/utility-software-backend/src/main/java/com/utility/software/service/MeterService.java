package com.utility.software.service;

import com.utility.software.dto.MeterView;
import com.utility.software.entity.Meter;
import com.utility.software.enums.MeterStatus;
import com.utility.software.repository.MeterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MeterService {

    private final MeterRepository repo;

    public MeterService(MeterRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<MeterView> getAll() {
        return repo.findAllByOrderByIdAsc().stream().map(MeterView::from).toList();
    }

    /** "Refresh" button: simulates new live values for every ONLINE meter. */
    @Transactional
    public List<MeterView> refresh() {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        List<Meter> meters = repo.findAllByOrderByIdAsc();
        LocalDateTime now = LocalDateTime.now();

        for (Meter m : meters) {
            if (m.getStatus() == MeterStatus.ONLINE) {
                double voltage = round(rnd.nextDouble(225, 235));
                double current = round(rnd.nextDouble(4, 7));
                double power = round(voltage * current);
                double reading = round((m.getReading() == null ? 0 : m.getReading()) + power / 1000 / 60);
                m.setVoltage(voltage);
                m.setCurrent(current);
                m.setPower(power);
                m.setReading(reading);
            }
            m.setLastUpdated(now);
        }
        return repo.saveAll(meters).stream().map(MeterView::from).toList();
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
