<?php

namespace App\Events;

use App\Models\CaseAct;
use App\Models\CaseModel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewCaseActDetected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public CaseAct $act;
    public CaseModel $case;
    public int $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(CaseAct $act, CaseModel $case, int $userId)
    {
        $this->act = $act;
        $this->case = $case;
        $this->userId = $userId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'new_act',
            'case_id' => $this->case->id,
            'case_number' => $this->case->case_number,
            'act_id' => $this->act->id,
            'act_type' => $this->act->act_type,
            'act_date' => $this->act->act_date?->toISOString(),
            'urgency' => $this->act->urgency_level,
            'message' => "Nuevo auto detectado en caso {$this->case->case_number}",
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'new.case.act';
    }
}
