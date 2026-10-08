package com.utility.software.service;

import com.utility.software.dto.MeterData;
import com.utility.software.dto.MeterItem;
import com.utility.software.dto.MeterRequest;
import com.utility.software.dto.MeterResponse;
import com.utility.software.entity.Meter;
import com.utility.software.enums.MeterStatus;
import com.utility.software.enums.OperationType;
import com.utility.software.exception.ResourceNotFoundException;
import com.utility.software.repository.MeterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RequestService {

    private final MeterRepository meterRepo;
    private final HistoryService historyService;

    public RequestService(MeterRepository meterRepo, HistoryService historyService) {
        this.meterRepo = meterRepo;
        this.historyService = historyService;
    }

    /** "Send Request" button. */
    @Transactional
    public MeterResponse process(MeterRequest req) {
        Meter meter = meterRepo.findById(req.meterId()).orElse(null);

        if (meter == null) {
            historyService.log(req, null, false);
            throw new ResourceNotFoundException("Meter not found with id: " + req.meterId());
        }

        boolean online = meter.getStatus() == MeterStatus.ONLINE;
        MeterResponse response;

        if (!online) {
            // device unreachable -> ipStatus=false, no data
            response = new MeterResponse(req.messageId(), req.opType(), req.ipAddress(), false, List.of());
        } else {
            if (req.opType() == OperationType.WRITE) {
                applyWrite(meter, req);
            }
            meter.setLastUpdated(LocalDateTime.now());
            meterRepo.save(meter);

            MeterItem item = new MeterItem(
                    meter.getId(),
                    meter.getMeterTypeId(),
                    new MeterData(meter.getReading(), meter.getVoltage(), meter.getCurrent(), meter.getPower())
            );
            response = new MeterResponse(req.messageId(), req.opType(), req.ipAddress(), true, List.of(item));
        }

        historyService.log(req, response, online);
        return response;
    }

    private void applyWrite(Meter meter, MeterRequest req) {
        meter.setIpAddress(req.ipAddress());
        if (req.meterTypeId() != null) {
            meter.setMeterTypeId(req.meterTypeId());
        }
        MeterData d = req.data();
        if (d != null) {
            if (d.reading() != null) meter.setReading(d.reading());
            if (d.voltage() != null) meter.setVoltage(d.voltage());
            if (d.current() != null) meter.setCurrent(d.current());
            if (d.power() != null) meter.setPower(d.power());
        }
    }
}
